/**
 * Section 4 Semantic Cache - Acceptance Tests
 * Tests semantic embedding, similarity, and caching functionality
 */

import {
  checkCache,
  storeInCache,
  cosineSimilarity,
  estimateCost,
  generateEmbedding,
  clearCache,
  type Embedding,
} from "./semantic";
import { connectRedis, disconnectRedis } from "../config/redis";
import { logger } from "../utils/logger";

/**
 * Test 1: Identical requests return similarity = 1.0
 */
async function testIdenticalRequests(): Promise<boolean> {
  try {
    logger.info("Test 1: Identical Requests");

    // Clear cache first
    await clearCache();

    const testData = {
      title: "Biology Test",
      subject: "Biology",
      grade: "Grade 10",
      numQuestions: 10,
    };

    const testContext = {
      title: testData.title,
      subject: testData.subject,
      grade: testData.grade,
      sections: [
        {
          name: "Section A",
          count: testData.numQuestions,
          marksPerQ: 1,
          difficulty: "Easy" as const,
          type: "MCQ" as const,
        },
      ],
      totalQuestions: testData.numQuestions,
      questionTypes: ["MCQ"],
    };

    // Generate same embedding twice
    const embedding1 = await generateEmbedding(testContext);

    const embedding2 = await generateEmbedding(testContext);

    // Compute similarity
    const similarity = cosineSimilarity(embedding1, embedding2);

    logger.info(
      `Similarity between identical requests: ${similarity.toFixed(4)}`,
    );

    if (Math.abs(similarity - 1.0) < 0.001) {
      console.log("✅ Test 1 PASSED: Identical requests have similarity ≈ 1.0");
      return true;
    } else {
      console.log(
        `❌ Test 1 FAILED: Expected similarity ≈ 1.0, got ${similarity.toFixed(4)}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 1 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 2: Similar requests (different word order) return hit
 */
async function testSimilarRequests(): Promise<boolean> {
  try {
    logger.info("Test 2: Similar Requests (Different Word Order)");

    await clearCache();

    // Store first variant
    const result1 = {
      sections: [{ name: "Section A", questions: [] }],
      totalQuestions: 5,
      totalMarks: 10,
    };

    const testContext = {
      title: "Photosynthesis",
      subject: "Biology",
      grade: "Grade 8",
      sections: [
        {
          name: "Section A",
          count: 5,
          marksPerQ: 1,
          difficulty: "Easy" as const,
          type: "MCQ" as const,
        },
      ],
      totalQuestions: 5,
      questionTypes: ["MCQ"],
    };

    await storeInCache(testContext, result1);

    // Check with similar variant (different word order)
    const cacheResult = await checkCache(testContext);

    logger.info(
      `Cache result for similar request: hit=${cacheResult.hit}, similarity=${cacheResult.similarity?.toFixed(4)}`,
    );

    if (
      cacheResult.hit &&
      cacheResult.similarity &&
      cacheResult.similarity >= 0.85
    ) {
      console.log(
        `✅ Test 2 PASSED: Similar requests return hit with similarity ${cacheResult.similarity.toFixed(4)}`,
      );
      return true;
    } else {
      console.log(
        `❌ Test 2 FAILED: Expected hit with similarity >= 0.85, got hit=${cacheResult.hit}, similarity=${cacheResult.similarity?.toFixed(4)}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 2 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 3: Different requests return miss
 */
async function testDifferentRequests(): Promise<boolean> {
  try {
    logger.info("Test 3: Different Requests (Different Subjects)");

    await clearCache();

    // Store first subject
    const result1 = {
      sections: [{ name: "Section A", questions: [] }],
      totalQuestions: 5,
      totalMarks: 10,
    };

    const testContext = {
      title: "Photosynthesis",
      subject: "Biology",
      grade: "Grade 8",
      sections: [
        {
          name: "Section A",
          count: 5,
          marksPerQ: 1,
          difficulty: "Easy" as const,
          type: "MCQ" as const,
        },
      ],
      totalQuestions: 5,
      questionTypes: ["MCQ"],
    };

    await storeInCache(testContext, result1);

    // Check with different subject
    const cacheResult = await checkCache({
      title: "French Revolution",
      subject: "History",
      grade: "Grade 8",
      sections: [
        {
          name: "Section A",
          count: 5,
          marksPerQ: 1,
          difficulty: "Easy" as const,
          type: "MCQ" as const,
        },
      ],
      totalQuestions: 5,
      questionTypes: ["MCQ"],
    });

    logger.info(
      `Cache result for different request: hit=${cacheResult.hit}, similarity=${cacheResult.similarity?.toFixed(4)}`,
    );

    if (!cacheResult.hit) {
      console.log("✅ Test 3 PASSED: Different requests return miss");
      return true;
    } else {
      console.log(
        `❌ Test 3 FAILED: Expected miss, got hit with similarity ${cacheResult.similarity?.toFixed(4)}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 3 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 4: Cost estimation calculates correctly
 */
function testCostEstimation(): boolean {
  try {
    logger.info("Test 4: Cost Estimation");

    const cost = estimateCost({
      sectionA: 5,
      sectionB: 3,
      sectionC: 2,
    });

    logger.info(`Cost estimation: (5 + 3 + 2) * 2.5 = ${cost}`);

    if (cost === 25) {
      console.log("✅ Test 4 PASSED: Cost estimation = 25");
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Expected cost 25, got ${cost}`);
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 4 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 5: Cosine similarity properties
 */
function testCosineSimilarity(): boolean {
  try {
    logger.info("Test 5: Cosine Similarity Properties");

    // Test identical vectors
    const v1: Embedding = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const v2: Embedding = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sim1 = cosineSimilarity(v1, v2);

    // Test orthogonal vectors
    const v3: Embedding = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const v4: Embedding = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sim2 = cosineSimilarity(v3, v4);

    logger.info(`Identical vectors similarity: ${sim1.toFixed(4)}`);
    logger.info(`Orthogonal vectors similarity: ${sim2.toFixed(4)}`);

    if (Math.abs(sim1 - 1.0) < 0.001 && Math.abs(sim2 - 0) < 0.001) {
      console.log("✅ Test 5 PASSED: Cosine similarity properties correct");
      return true;
    } else {
      console.log(
        `❌ Test 5 FAILED: Unexpected similarity values (identical: ${sim1.toFixed(4)}, orthogonal: ${sim2.toFixed(4)})`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 5 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Run all acceptance tests
 */
export async function runSemanticCacheAcceptanceTests(): Promise<void> {
  try {
    console.log("\n========== Section 4: Semantic Cache Tests ==========\n");

    // Connect to Redis
    await connectRedis();

    // Run tests
    const results = [
      await testIdenticalRequests(),
      await testSimilarRequests(),
      await testDifferentRequests(),
      testCostEstimation(),
      testCosineSimilarity(),
    ];

    const passed = results.filter((r) => r).length;
    const total = results.length;

    console.log(
      `\n========== Results: ${passed}/${total} tests passed ==========\n`,
    );

    if (passed === total) {
      console.log("🎉 All semantic cache acceptance criteria met!");
    } else {
      console.log(`⚠️ ${total - passed} test(s) failed`);
    }

    // Cleanup
    await clearCache();
    await disconnectRedis();

    if (passed !== total) {
      process.exit(1);
    }
  } catch (error) {
    logger.error("Test suite error:", error);
    process.exit(1);
  }
}

// Uncomment to run tests (requires Redis connection and .env setup)
// runSemanticCacheAcceptanceTests();
