/**
 * LLM Router with Groq API
 *
 * Complexity Classification:
 * - SIMPLE: <= 15 questions, title < 40 chars, elementary grades (1-5)
 * - COMPLEX: anything else
 *
 * Model Selection:
 * - SIMPLE: Groq llama-3.3-70b-versatile
 * - COMPLEX: Groq llama-3.3-70b-versatile
 */

import { logger } from "../utils/logger";
import { env } from "../config/env";
import { primaryBreaker } from "./breaker";

type Complexity = "simple" | "complex";

interface LLMResponse {
  content: string;
  modelUsed: string;
  tokensUsed: number;
}

interface SectionCounts {
  sectionA?: number;
  sectionB?: number;
  sectionC?: number;
}

/**
 * Classify a request as simple or complex based on parameters
 *
 * Criteria for SIMPLE:
 * - Total questions <= 15
 * - Title length < 40 characters
 * - Grade in elementary range (1-5)
 */
export function classifyRequest(
  title: string,
  grade: string,
  numQuestions: SectionCounts,
): Complexity {
  const totalQuestions =
    (numQuestions.sectionA || 0) +
    (numQuestions.sectionB || 0) +
    (numQuestions.sectionC || 0);
  const gradeNum = parseInt(grade, 10);
  const isElementary = gradeNum >= 1 && gradeNum <= 5;

  const isSimple = totalQuestions <= 15 && title.length < 40 && isElementary;

  logger.debug(`Classified request as ${isSimple ? "SIMPLE" : "COMPLEX"}`, {
    title,
    grade,
    totalQuestions,
    titleLength: title.length,
    isElementary,
  });

  return isSimple ? "simple" : "complex";
}

/**
 * Call Groq API
 */
async function callGroqAPI(
  prompt: string,
  model: string,
): Promise<LLMResponse> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You generate exam papers. Return only valid JSON that matches the requested schema. Do not add markdown, explanations, or placeholder text.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.2,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content || "";
  const tokensUsed = data.usage?.completion_tokens || 0;

  return { content, modelUsed: model, tokensUsed };
}

/**
 * Route LLM call using Groq
 *
 * Strategy:
 * 1. Classify request complexity
 * 2. Route to Groq API with llama-3.3-70b-versatile model
 * 3. Use circuit breaker for reliability
 */
export async function routeLLMCall(
  prompt: string,
  title: string,
  grade: string,
  numQuestions: SectionCounts,
): Promise<LLMResponse> {
  const complexity = classifyRequest(title, grade, numQuestions);
  const model = "llama-3.3-70b-versatile"; // Supported Groq production model for text generation

  try {
    logger.info(`Routing to Groq LLM [${model}]`, {
      title,
      grade,
      complexity,
    });

    const result = await primaryBreaker.call(async () => {
      return await callGroqAPI(prompt, model);
    });

    logger.info(`LLM call succeeded via Groq [${model}]`, {
      tokensUsed: result.tokensUsed,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Groq LLM provider failed`, {
      error: errorMessage,
      primaryBreakerStats: primaryBreaker.getStats(),
    });

    if (errorMessage.includes("Circuit breaker")) {
      throw new Error(`LLM_PROVIDER_DOWN: ${errorMessage}`);
    }

    throw new Error(`LLM_PROVIDER_DOWN: ${errorMessage}`);
  }
}
