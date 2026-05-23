/**
 * Section 5: Circuit Breaker + LLM Router Acceptance Tests
 * Verifies:
 * 1. Request classification logic (simple vs complex)
 * 2. Circuit breaker state transitions
 * 3. Fallback behavior when primary circuit opens
 * 4. getStats() accuracy
 */

import { classifyRequest } from "./router";
import { CircuitBreaker } from "./breaker";
import { logger } from "../utils/logger";

/**
 * Test 1: Simple request classification
 *
 * Input: 'Fractions', grade '3', {sectionA:5, sectionB:3, sectionC:2}
 * - Total questions: 5+3+2 = 10 (≤ 15 ✓)
 * - Title length: 9 (< 40 ✓)
 * - Grade 3 (elementary 1-5 ✓)
 * Expected: 'simple'
 */
function testSimpleClassification(): boolean {
  try {
    logger.info("Acceptance Test 1: Simple Request Classification");

    const result = classifyRequest("Fractions", "3", {
      sectionA: 5,
      sectionB: 3,
      sectionC: 2,
    });

    if (result === "simple") {
      console.log(
        '✅ Test 1 PASSED: classifyRequest("Fractions", "3", {5,3,2}) = "simple"',
      );
      return true;
    } else {
      console.log(`❌ Test 1 FAILED: Expected "simple", got "${result}"`);
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
 * Test 2: Complex request classification
 *
 * Input: 'Quantum Entanglement implications', grade '11', {sectionA:10, sectionB:8, sectionC:7}
 * - Total questions: 10+8+7 = 25 (> 15 ✗)
 * - Title length: 31 (> 40 ✗)
 * - Grade 11 (not elementary ✗)
 * Expected: 'complex'
 */
function testComplexClassification(): boolean {
  try {
    logger.info("Acceptance Test 2: Complex Request Classification");

    const result = classifyRequest("Quantum Entanglement implications", "11", {
      sectionA: 10,
      sectionB: 8,
      sectionC: 7,
    });

    if (result === "complex") {
      console.log(
        '✅ Test 2 PASSED: classifyRequest("Quantum Entanglement implications", "11", {10,8,7}) = "complex"',
      );
      return true;
    } else {
      console.log(`❌ Test 2 FAILED: Expected "complex", got "${result}"`);
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
 * Test 3: Circuit breaker opens after failureThreshold failures
 *
 * Create circuit breaker with failureThreshold=3
 * Call fn() 3 times, all fail
 * Verify state transitions: CLOSED → OPEN
 */
async function testCircuitBreakerOpens(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 3: Circuit Breaker Opens After Failures");

    const breaker = new CircuitBreaker("test-breaker", {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
    });

    // Call 1: CLOSED, fail
    try {
      await breaker.call(async () => {
        throw new Error("Intentional failure");
      });
    } catch {
      /* ignore */
    }

    // Call 2: CLOSED, fail
    try {
      await breaker.call(async () => {
        throw new Error("Intentional failure");
      });
    } catch {
      /* ignore */
    }

    // Call 3: CLOSED, fail → should transition to OPEN
    try {
      await breaker.call(async () => {
        throw new Error("Intentional failure");
      });
    } catch {
      /* ignore */
    }

    const stats = breaker.getStats();

    if (stats.state === "OPEN" && stats.failureCount === 3) {
      console.log(
        `✅ Test 3 PASSED: Circuit breaker opened after ${stats.failureCount} failures`,
      );
      return true;
    } else {
      console.log(
        `❌ Test 3 FAILED: Expected state OPEN with failureCount=3, got state=${stats.state} failureCount=${stats.failureCount}`,
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
 * Test 4: Circuit breaker rejects calls when OPEN
 *
 * Create circuit breaker with failureThreshold=1
 * Force it to OPEN
 * Verify subsequent calls throw immediately
 */
async function testCircuitBreakerRejectsWhenOpen(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 4: Circuit Breaker Rejects When OPEN");

    const breaker = new CircuitBreaker("test-breaker-2", {
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 30000,
    });

    // Force OPEN by failing once
    try {
      await breaker.call(async () => {
        throw new Error("Intentional failure");
      });
    } catch {
      /* ignore */
    }

    // Verify state is OPEN
    const statsAfterFailure = breaker.getStats();
    if (statsAfterFailure.state !== "OPEN") {
      console.log(
        `❌ Test 4 FAILED: Circuit breaker not opened, state = ${statsAfterFailure.state}`,
      );
      return false;
    }

    // Attempt another call - should throw immediately
    let threwError = false;
    try {
      await breaker.call(async () => {
        return "Success";
      });
    } catch {
      threwError = true;
    }

    if (threwError) {
      console.log("✅ Test 4 PASSED: Circuit breaker rejects calls when OPEN");
      return true;
    } else {
      console.log(
        "❌ Test 4 FAILED: Circuit breaker did not reject call when OPEN",
      );
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
 * Test 5: Circuit breaker recovers from OPEN to CLOSED
 *
 * Create circuit breaker with:
 * - failureThreshold=1
 * - successThreshold=2
 * - timeout=100ms
 *
 * Steps:
 * 1. Fail once → state = OPEN
 * 2. Wait 100ms
 * 3. Succeed 2 times → state = CLOSED
 */
async function testCircuitBreakerRecovery(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 5: Circuit Breaker Recovers from OPEN");

    const breaker = new CircuitBreaker("test-breaker-3", {
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 100,
    });

    // Step 1: Force OPEN
    try {
      await breaker.call(async () => {
        throw new Error("Intentional failure");
      });
    } catch {
      /* ignore */
    }

    if (breaker.getStats().state !== "OPEN") {
      console.log("❌ Test 5 FAILED: Circuit breaker not in OPEN state");
      return false;
    }

    // Step 2: Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Step 3: Succeed twice to recover
    try {
      await breaker.call(async () => {
        return "Success 1";
      });
    } catch {
      /* ignore */
    }

    try {
      await breaker.call(async () => {
        return "Success 2";
      });
    } catch {
      /* ignore */
    }

    // Verify state is CLOSED
    const finalStats = breaker.getStats();
    if (finalStats.state === "CLOSED" && finalStats.successCount >= 2) {
      console.log(
        "✅ Test 5 PASSED: Circuit breaker recovered to CLOSED after 2 successes",
      );
      return true;
    } else {
      console.log(
        `❌ Test 5 FAILED: Expected state CLOSED, got ${finalStats.state}, successCount: ${finalStats.successCount}`,
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
 * Test 6: getStats() returns accurate counts
 *
 * Create circuit breaker with failureThreshold=5
 * Call it 3 times with failures
 * Verify getStats() returns { state, failureCount: 3, successCount: 0, openedAt }
 */
async function testGetStats(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 6: getStats() Returns Accurate Counts");

    const breaker = new CircuitBreaker("test-breaker-4", {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    });

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.call(async () => {
          throw new Error("Intentional failure");
        });
      } catch {
        /* ignore */
      }
    }

    const stats = breaker.getStats();

    if (
      stats.state === "CLOSED" &&
      stats.failureCount === 3 &&
      stats.successCount === 0 &&
      stats.openedAt === null
    ) {
      console.log(
        `✅ Test 6 PASSED: getStats() = {state: CLOSED, failureCount: 3, successCount: 0, openedAt: null}`,
      );
      return true;
    } else {
      console.log(`❌ Test 6 FAILED: getStats() mismatch`);
      console.log(
        `  Expected: {state: CLOSED, failureCount: 3, successCount: 0, openedAt: null}`,
      );
      console.log(
        `  Got: {state: ${stats.state}, failureCount: ${stats.failureCount}, successCount: ${stats.successCount}, openedAt: ${stats.openedAt}}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 6 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 7: Title length classification boundary
 *
 * Title with exactly 39 chars should be simple (if other criteria met)
 * Title with 40 chars should be complex
 */
function testTitleLengthBoundary(): boolean {
  try {
    logger.info("Acceptance Test 7: Title Length Boundary Condition");

    // 39 chars - should be simple
    const title39 = "A".repeat(39); // Exactly 39 characters
    const result39 = classifyRequest(title39, "2", {
      sectionA: 5,
      sectionB: 5,
    });

    // 40 chars - should be complex
    const title40 = "A".repeat(40); // Exactly 40 characters
    const result40 = classifyRequest(title40, "2", {
      sectionA: 5,
      sectionB: 5,
    });

    if (result39 === "simple" && result40 === "complex") {
      console.log(
        "✅ Test 7 PASSED: Title length boundary correct (< 40 = simple, >= 40 = complex)",
      );
      return true;
    } else {
      console.log(
        `❌ Test 7 FAILED: Expected 39-char="simple" and 40-char="complex", got 39-char="${result39}" and 40-char="${result40}"`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 7 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Run all acceptance tests
 */
export async function runCircuitBreakerAcceptanceTests(): Promise<void> {
  try {
    console.log(
      "\n========== Section 5: Circuit Breaker + LLM Router Acceptance Tests ==========\n",
    );

    const results = await Promise.all([
      testSimpleClassification(),
      testComplexClassification(),
      testCircuitBreakerOpens(),
      testCircuitBreakerRejectsWhenOpen(),
      testCircuitBreakerRecovery(),
      testGetStats(),
      testTitleLengthBoundary(),
    ]);

    const passed = results.filter((r) => r).length;
    const total = results.length;

    console.log(
      `\n========== Results: ${passed}/${total} tests passed ==========\n`,
    );

    if (passed === total) {
      console.log("🎉 All acceptance tests passed!");
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
runCircuitBreakerAcceptanceTests();
