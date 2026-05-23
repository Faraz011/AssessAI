import pino from "pino";
import { env } from "../config/env";

/**
 * Pino Logger Setup
 * Structured logging with request tracking support
 */

const isDevelopment = env.NODE_ENV === "development";

/**
 * Create base logger instance
 */
const baseLogger = pino(
  {
    level: env.LOG_LEVEL,
    transport: isDevelopment
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: false,
          },
        }
      : undefined,
  },
  pino.destination(),
);

/**
 * Logger interface with request tracking
 */
export class Logger {
  private logger: pino.Logger;
  private requestId?: string;

  constructor(requestId?: string) {
    this.requestId = requestId;
    this.logger = baseLogger;
  }

  /**
   * Create child logger with request ID context
   */
  static withRequest(requestId: string): Logger {
    return new Logger(requestId);
  }

  /**
   * Add request ID to context
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Get context object for logging
   */
  private getContext() {
    return this.requestId ? { requestId: this.requestId } : {};
  }

  debug(message: string, data?: any): void {
    this.logger.debug({ ...this.getContext(), ...data }, message);
  }

  info(message: string, data?: any): void {
    this.logger.info({ ...this.getContext(), ...data }, message);
  }

  warn(message: string, data?: any): void {
    this.logger.warn({ ...this.getContext(), ...data }, message);
  }

  error(message: string, error?: Error | any): void {
    const errorData =
      error instanceof Error
        ? { error: error.message, stack: error.stack }
        : error;
    this.logger.error({ ...this.getContext(), ...errorData }, message);
  }

  /**
   * Log API call
   */
  logApiCall(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
  ): void {
    const level = statusCode >= 400 ? "warn" : "info";
    this.logger[level](
      {
        ...this.getContext(),
        method,
        path,
        statusCode,
        durationMs: duration,
      },
      `${method} ${path} - ${statusCode}`,
    );
  }

  /**
   * Log LLM call
   */
  logLlmCall(
    model: string,
    tokensIn: number,
    tokensOut: number,
    duration: number,
    costInr?: number,
  ): void {
    this.logger.info(
      {
        ...this.getContext(),
        model,
        tokensIn,
        tokensOut,
        durationMs: duration,
        costInr,
      },
      "LLM API call",
    );
  }

  /**
   * Log job progress
   */
  logJobProgress(jobId: string, status: string, progress: number): void {
    this.logger.info(
      {
        ...this.getContext(),
        jobId,
        status,
        progress,
      },
      "Job progress",
    );
  }

  /**
   * Log cache operation
   */
  logCacheOperation(
    operation: "hit" | "miss" | "set" | "delete",
    key: string,
    duration?: number,
  ): void {
    this.logger.debug(
      {
        ...this.getContext(),
        operation,
        key,
        durationMs: duration,
      },
      "Cache operation",
    );
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

export default logger;
