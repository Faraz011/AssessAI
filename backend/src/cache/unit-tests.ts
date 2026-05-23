/**
 * Section 4 Semantic Cache - Unit Tests
 * Tests core logic without requiring Redis or API
 */

import { cosineSimilarity, estimateCost, type Embedding } from "./semantic";
import { logger } from "../utils/logger";

/**
 * Test 1: Identical vectors have similarity 1.0
 */
function testIdenticalVectors(): boolean {
  try {
    logger.info("Unit Test 1: Identical Vectors");

    const v1: Embedding = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];
    const v2: Embedding = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];

    const similarity = cosineSimilarity(v1, v2);
    logger.info(`Similarity: ${similarity.toFixed(4)}`);

    if (Math.abs(similarity - 1.0) < 0.0001) {
      console.log(
        "✅ Unit Test 1 PASSED: Identical vectors → similarity = 1.0",
      );
      return true;
    } else {
      console.log(
        `❌ Unit Test 1 FAILED: Expected 1.0, got ${similarity.toFixed(4)}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Unit Test 1 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 2: Orthogonal vectors have similarity 0.0
 */
function testOrthogonalVectors(): boolean {
  try {
    logger.info("Unit Test 2: Orthogonal Vectors");

    const v1: Embedding = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const v2: Embedding = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const similarity = cosineSimilarity(v1, v2);
    logger.info(`Similarity: ${similarity.toFixed(4)}`);

    if (Math.abs(similarity) < 0.0001) {
      console.log(
        "✅ Unit Test 2 PASSED: Orthogonal vectors → similarity = 0.0",
      );
      return true;
    } else {
      console.log(
        `❌ Unit Test 2 FAILED: Expected 0.0, got ${similarity.toFixed(4)}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Unit Test 2 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 3: Similar vectors (scaled) have high similarity
 */
function testSimilarVectors(): boolean {
  try {
    logger.info("Unit Test 3: Similar Vectors (Scaled)");

    const v1: Embedding = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];
    const v2: Embedding = [
      2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32,
    ];

    const similarity = cosineSimilarity(v1, v2);
    logger.info(`Similarity: ${similarity.toFixed(4)}`);

    if (similarity > 0.9999) {
      console.log("✅ Unit Test 3 PASSED: Scaled vectors → similarity ≈ 1.0");
      return true;
    } else {
      console.log(
        `❌ Unit Test 3 FAILED: Expected ~1.0, got ${similarity.toFixed(4)}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Unit Test 3 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 4: Cost estimation formula
 */
function testCostEstimation1(): boolean {
  try {
    logger.info("Unit Test 4: Cost Estimation (5+3+2)*2.5");

    const cost = estimateCost({
      sectionA: 5,
      sectionB: 3,
      sectionC: 2,
    });

    logger.info(`Cost: ${cost}`);

    if (cost === 25) {
      console.log("✅ Unit Test 4 PASSED: estimateCost({5,3,2}) = 25");
      return true;
    } else {
      console.log(`❌ Unit Test 4 FAILED: Expected 25, got ${cost}`);
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Unit Test 4 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 5: Cost estimation with partial sections
 */
function testCostEstimation2(): boolean {
  try {
    logger.info("Unit Test 5: Cost Estimation (only sectionA)");

    const cost = estimateCost({
      sectionA: 10,
    });

    logger.info(`Cost: ${cost}`);

    if (cost === 25) {
      console.log("✅ Unit Test 5 PASSED: estimateCost({10,0,0}) = 25");
      return true;
    } else {
      console.log(`❌ Unit Test 5 FAILED: Expected 25, got ${cost}`);
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Unit Test 5 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 6: Cosine similarity properties (commutative)
 */
function testCosineSimilarityCommutative(): boolean {
  try {
    logger.info("Unit Test 6: Cosine Similarity Commutative");

    const v1: Embedding = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];
    const v2: Embedding = [
      5, 4, 3, 2, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ];

    const sim1 = cosineSimilarity(v1, v2);
    const sim2 = cosineSimilarity(v2, v1);

    logger.info(
      `Similarity(v1,v2): ${sim1.toFixed(4)}, Similarity(v2,v1): ${sim2.toFixed(4)}`,
    );

    if (Math.abs(sim1 - sim2) < 0.0001) {
      console.log("✅ Unit Test 6 PASSED: Cosine similarity is commutative");
      return true;
    } else {
      console.log(
        `❌ Unit Test 6 FAILED: Similarities don't match (${sim1.toFixed(4)} vs ${sim2.toFixed(4)})`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Unit Test 6 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 7: Cosine similarity bounded [0, 1]
 */
function testCosineSimilarityBounded(): boolean {
  try {
    logger.info("Unit Test 7: Cosine Similarity Bounded [0,1]");

    const vectors: Embedding[] = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        const sim = cosineSimilarity(vectors[i], vectors[j]);
        if (sim < 0 || sim > 1) {
          console.log(
            `❌ Unit Test 7 FAILED: Similarity ${sim} out of bounds [0,1]`,
          );
          return false;
        }
      }
    }

    console.log("✅ Unit Test 7 PASSED: All similarities in [0,1]");
    return true;
  } catch (error) {
    console.log(
      "❌ Unit Test 7 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Run all unit tests
 */
export function runSemanticCacheUnitTests(): void {
  try {
    console.log(
      "\n========== Section 4: Semantic Cache Unit Tests ==========\n",
    );

    const results = [
      testIdenticalVectors(),
      testOrthogonalVectors(),
      testSimilarVectors(),
      testCostEstimation1(),
      testCostEstimation2(),
      testCosineSimilarityCommutative(),
      testCosineSimilarityBounded(),
    ];

    const passed = results.filter((r) => r).length;
    const total = results.length;

    console.log(
      `\n========== Results: ${passed}/${total} tests passed ==========\n`,
    );

    if (passed === total) {
      console.log("🎉 All semantic cache unit tests passed!");
    } else {
      console.log(`⚠️ ${total - passed} test(s) failed`);
      process.exit(1);
    }
  } catch (error) {
    logger.error("Test suite error:", error);
    process.exit(1);
  }
}

// Run tests
runSemanticCacheUnitTests();
