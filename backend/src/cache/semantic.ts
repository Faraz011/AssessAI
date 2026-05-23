/**
 * Semantic Cache Implementation
 * Uses embeddings and cosine similarity for semantic matching
 * Stores results in Redis with 7-day TTL
 */

import { getRedis } from "../config/redis";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import crypto from "crypto";
import type { InputSection } from "../models/Assignment";

const CACHE_VERSION = "v2";

/**
 * Vector embedding type - 16 floats
 */
export type Embedding = number[];

/**
 * Cached result structure
 */
export interface CachedResult {
  vector: Embedding;
  result: any; // Question paper result
  createdAt: string; // ISO timestamp
  similarity?: number; // For tracking hit quality
}

export interface AssessmentCacheContext {
  title: string;
  subject?: string;
  grade: string;
  sections: InputSection[];
  totalQuestions: number;
  questionTypes: string[];
  instructions?: string;
  fileContent?: string;
}

/**
 * Cache check response
 */
export interface CacheCheckResponse {
  hit: boolean;
  result?: any;
  similarity?: number;
  savedCost?: number;
  key?: string;
}

/**
 * Generate semantic embedding using Groq API
 * No external dependencies - uses native fetch
 * @param context - Assessment request context
 * @returns Embedding vector (16 floats)
 */
export function generateEmbedding(
  title: string,
  subject: string | undefined,
  grade: string,
  numQuestions: number,
): Promise<Embedding>;
export function generateEmbedding(
  context: AssessmentCacheContext,
): Promise<Embedding>;
export async function generateEmbedding(
  arg1: string | AssessmentCacheContext,
  arg2?: string | undefined,
  arg3?: string,
  arg4?: number,
): Promise<Embedding> {
  const context: AssessmentCacheContext =
    typeof arg1 === "string"
      ? {
          title: arg1,
          subject: arg2,
          grade: arg3 || "",
          sections: [
            {
              name: "Section A",
              count: arg4 || 0,
              marksPerQ: 1,
              difficulty: "Easy",
              type: "MCQ",
            },
          ],
          totalQuestions: arg4 || 0,
          questionTypes: ["MCQ"],
        }
      : arg1;

  try {
    const sectionSummary = context.sections
      .map(
        (section) =>
          `${section.name}:${section.count}x${section.marksPerQ}:${section.difficulty}:${section.type}`,
      )
      .join(" | ");
    const prompt = `Return ONLY a JSON array of 16 floats (no other text) that semantically represents this assessment request.

Title: ${context.title}
Subject: ${context.subject || ""}
Grade: ${context.grade}
Total questions: ${context.totalQuestions}
Question types: ${context.questionTypes.join(", ")}
Section plan: ${sectionSummary}
Instructions: ${context.instructions || ""}
Source excerpt: ${(context.fileContent || "").slice(0, 1000)}`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content || "";

    // Parse JSON array from response
    const embedding = JSON.parse(content.trim());

    if (!Array.isArray(embedding) || embedding.length !== 16) {
      throw new Error("Invalid embedding format: expected array of 16 floats");
    }

    // Verify all elements are numbers
    if (!embedding.every((n: any) => typeof n === "number")) {
      throw new Error("Invalid embedding: all elements must be numbers");
    }

    return embedding as Embedding;
  } catch (error) {
    logger.error("Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Compute cosine similarity between two vectors
 * Formula: (a · b) / (|a| * |b|)
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between 0 and 1
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  // Compute dot product
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  // Compute magnitude of a
  let magA = 0;
  for (let i = 0; i < a.length; i++) {
    magA += a[i] * a[i];
  }
  magA = Math.sqrt(magA);

  // Compute magnitude of b
  let magB = 0;
  for (let i = 0; i < b.length; i++) {
    magB += b[i] * b[i];
  }
  magB = Math.sqrt(magB);

  // Avoid division by zero
  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct / (magA * magB);
}

/**
 * Estimate cost savings in rupees
 * Formula: (total questions) * 2.5
 * @param numQuestions - Object with section question counts
 * @returns Estimated cost saved in INR
 */
export function estimateCost(numQuestions: {
  sectionA?: number;
  sectionB?: number;
  sectionC?: number;
}): number {
  const total =
    (numQuestions.sectionA || 0) +
    (numQuestions.sectionB || 0) +
    (numQuestions.sectionC || 0);
  return total * 2.5;
}

/**
 * Generate deterministic hash for cache key from request parameters
 * @param title - Assessment title
 * @param subject - Subject
 * @param grade - Grade
 * @returns MD5 hash
 */
function generateCacheKeyHash(context: AssessmentCacheContext): string {
  const sectionPlan = context.sections
    .map(
      (section) =>
        `${section.name}:${section.count}:${section.marksPerQ}:${section.difficulty}:${section.type}`,
    )
    .join("|");
  const input = [
    CACHE_VERSION,
    context.title,
    context.subject || "",
    context.grade,
    sectionPlan,
    context.questionTypes.join(","),
    context.instructions || "",
  ].join("::");
  return crypto.createHash("md5").update(input).digest("hex");
}

/**
 * Check semantic cache for similar assessment requests
 * @param title - Assessment title
 * @param subject - Subject of assessment
 * @param grade - Grade level
 * @param numQuestions - Total number of questions
 * @returns Cache check response with hit status
 */
export async function checkCache(
  context: AssessmentCacheContext,
): Promise<CacheCheckResponse>;
export async function checkCache(
  arg1: string | AssessmentCacheContext,
  arg2?: string | undefined,
  arg3?: string,
  arg4?: number,
): Promise<CacheCheckResponse> {
  const context: AssessmentCacheContext =
    typeof arg1 === "string"
      ? {
          title: arg1,
          subject: arg2,
          grade: arg3 || "",
          sections: [
            {
              name: "Section A",
              count: arg4 || 0,
              marksPerQ: 1,
              difficulty: "Easy",
              type: "MCQ",
            },
          ],
          totalQuestions: arg4 || 0,
          questionTypes: ["MCQ"],
        }
      : arg1;

  const redis = getRedis();
  if (!redis) {
    logger.warn("Redis not connected, skipping cache check");
    return { hit: false };
  }

  try {
    logger.debug("Checking semantic cache", {
      title: context.title,
      subject: context.subject,
      grade: context.grade,
      totalQuestions: context.totalQuestions,
    });

    // Step 1: Generate embedding for input request
    const inputEmbedding = await generateEmbedding(context);

    // Step 2: Fetch all cached embeddings
    const keys = await redis.keys(`assessment:embed:${CACHE_VERSION}:*`);
    if (keys.length === 0) {
      logger.info("Cache MISS: No cached assessments found");
      return { hit: false };
    }

    logger.debug(`Found ${keys.length} cached assessments`);

    // Step 3: Compute similarities and find best match
    let bestMatch: {
      key: string;
      similarity: number;
      result: any;
    } | null = null;

    for (const key of keys) {
      const cachedData = await redis.get(key);
      if (!cachedData) continue;

      try {
        const cached = JSON.parse(cachedData) as CachedResult;
        const similarity = cosineSimilarity(inputEmbedding, cached.vector);

        logger.debug(`Checked ${key}: similarity = ${similarity.toFixed(3)}`);

        // Track best match
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = {
            key,
            similarity,
            result: cached.result,
          };
        }
      } catch (parseError) {
        logger.warn(`Failed to parse cache entry ${key}:`, parseError);
      }
    }

    // Step 4: Return result if similarity threshold met
    if (bestMatch && bestMatch.similarity >= env.SEMANTIC_CACHE_THRESHOLD) {
      const savedCost = estimateCost({
        sectionA: context.sections.find(
          (section) => section.name === "Section A",
        )?.count,
        sectionB: context.sections.find(
          (section) => section.name === "Section B",
        )?.count,
        sectionC: context.sections.find(
          (section) => section.name === "Section C",
        )?.count,
      });

      logger.info(
        `Cache HIT: similarity = ${bestMatch.similarity.toFixed(3)}, saved ₹${savedCost.toFixed(2)}`,
      );

      return {
        hit: true,
        result: bestMatch.result,
        similarity: bestMatch.similarity,
        savedCost,
        key: bestMatch.key,
      };
    }

    logger.info(
      `Cache MISS: best similarity ${bestMatch?.similarity.toFixed(3) || "N/A"} < threshold ${env.SEMANTIC_CACHE_THRESHOLD}`,
    );
    return { hit: false };
  } catch (error) {
    logger.error("Error checking semantic cache:", error);
    return { hit: false };
  }
}

/**
 * Store result in semantic cache
 * @param title - Assessment title
 * @param subject - Subject
 * @param grade - Grade
 * @param numQuestions - Total questions
 * @param result - Generated question paper result
 * @returns Cache key used for storage
 */
export function storeInCache(
  title: string,
  subject: string | undefined,
  grade: string,
  numQuestions: number,
  result: any,
): Promise<string>;
export function storeInCache(
  context: AssessmentCacheContext,
  result: any,
): Promise<string>;
export async function storeInCache(
  arg1: string | AssessmentCacheContext,
  arg2?: string | undefined | any,
  arg3?: string,
  arg4?: number | any,
  arg5?: any,
): Promise<string> {
  const context: AssessmentCacheContext =
    typeof arg1 === "string"
      ? {
          title: arg1,
          subject: arg2,
          grade: arg3 || "",
          sections: [
            {
              name: "Section A",
              count: arg4 || 0,
              marksPerQ: 1,
              difficulty: "Easy",
              type: "MCQ",
            },
          ],
          totalQuestions: arg4 || 0,
          questionTypes: ["MCQ"],
        }
      : arg1;
  const result = typeof arg1 === "string" ? arg5 : arg2;

  const redis = getRedis();
  if (!redis) {
    logger.warn("Redis not connected, skipping cache store");
    return "";
  }

  try {
    logger.debug("Storing result in semantic cache", {
      title: context.title,
      subject: context.subject,
      grade: context.grade,
      totalQuestions: context.totalQuestions,
    });

    // Step 1: Generate embedding
    const embedding = await generateEmbedding(context);

    // Step 2: Create cache key with random suffix for uniqueness
    const hash = generateCacheKeyHash(context);
    const suffix = crypto.randomBytes(4).toString("hex");
    const key = `assessment:embed:${CACHE_VERSION}:${hash}:${suffix}`;

    // Step 3: Store in Redis with TTL
    const cachedData: CachedResult = {
      vector: embedding,
      result,
      createdAt: new Date().toISOString(),
    };

    await redis.setex(
      key,
      env.SEMANTIC_CACHE_TTL_SECONDS,
      JSON.stringify(cachedData),
    );

    logger.info(
      `Cached assessment: ${key} (TTL: ${env.SEMANTIC_CACHE_TTL_SECONDS}s)`,
    );
    return key;
  } catch (error) {
    logger.error("Error storing in semantic cache:", error);
    throw error;
  }
}

/**
 * Clear all semantic cache entries (utility function)
 */
export async function clearCache(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    logger.warn("Redis not connected, cannot clear cache");
    return;
  }

  try {
    const keys = await redis.keys(`assessment:embed:${CACHE_VERSION}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    logger.error("Error clearing semantic cache:", error);
    throw error;
  }
}

export default {
  checkCache,
  storeInCache,
  clearCache,
  cosineSimilarity,
  estimateCost,
  generateEmbedding,
};
