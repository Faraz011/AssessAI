/**
 * Circuit Breaker Pattern for LLM Provider Resilience
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery) → CLOSED
 */

import { logger } from "../utils/logger";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
}

interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  openedAt: number | null;
}

/**
 * CircuitBreaker: Protects against cascading failures
 *
 * State Machine:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Too many failures detected, requests rejected immediately
 * - HALF_OPEN: Recovery period, testing if service is healthy
 */
export class CircuitBreaker {
  private name: string;
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private successCount: number = 0;
  private openedAt: number | null = null;
  private failureThreshold: number;
  private successThreshold: number;
  private timeout: number;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Execute fn() with circuit breaker protection
   *
   * CLOSED state:
   *   - Execute fn()
   *   - On success: reset failureCount
   *   - On failure: increment failureCount, transition to OPEN if threshold exceeded
   *
   * OPEN state:
   *   - Check if timeout expired
   *   - If not expired: throw immediately (fail fast)
   *   - If expired: transition to HALF_OPEN
   *
   * HALF_OPEN state:
   *   - Execute fn()
   *   - On success: increment successCount, transition to CLOSED if threshold reached
   *   - On failure: transition back to OPEN
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "CLOSED") {
      try {
        const result = await fn();
        this.failureCount = 0; // Reset on success
        return result;
      } catch (error) {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
          this.state = "OPEN";
          this.openedAt = Date.now();
          logger.warn(
            `Circuit breaker [${this.name}] OPENED after ${this.failureCount} failures`,
          );
        }
        throw error;
      }
    } else if (this.state === "OPEN") {
      const elapsed = Date.now() - (this.openedAt || 0);
      if (elapsed < this.timeout) {
        // Timeout not expired, reject immediately
        throw new Error(
          `Circuit breaker [${this.name}] is OPEN (${elapsed}ms elapsed, timeout ${this.timeout}ms)`,
        );
      }
      // Timeout expired, attempt recovery
      this.state = "HALF_OPEN";
      this.successCount = 0;
      logger.info(`Circuit breaker [${this.name}] transitioned to HALF_OPEN`);
    }

    // HALF_OPEN state
    if (this.state === "HALF_OPEN") {
      try {
        const result = await fn();
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = "CLOSED";
          this.failureCount = 0;
          this.openedAt = null;
          logger.info(
            `Circuit breaker [${this.name}] CLOSED (recovered after ${this.successCount} successes)`,
          );
        }
        return result;
      } catch (error) {
        this.state = "OPEN";
        this.openedAt = Date.now();
        this.successCount = 0;
        logger.warn(
          `Circuit breaker [${this.name}] reopened (failure in HALF_OPEN)`,
        );
        throw error;
      }
    }

    throw new Error(`Invalid circuit breaker state: ${this.state}`);
  }

  /**
   * Returns current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Returns circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      openedAt: this.openedAt,
    };
  }
}

/**
 * LLM provider circuit breaker (Groq)
 * Thresholds: 5 failures to open, 2 successes to recover, 30s timeout
 */
export const primaryBreaker = new CircuitBreaker("groq-llm", {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
});
