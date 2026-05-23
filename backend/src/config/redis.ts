import Redis, { Redis as RedisClient } from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Redis Connection Manager
 * Handles Redis setup for cache, queue, and sessions
 */

let redisClient: RedisClient | null = null;

/**
 * Initialize Redis connection
 * @returns Redis client instance
 */
export async function connectRedis(): Promise<RedisClient> {
  if (redisClient) {
    logger.info("Using existing Redis connection");
    return redisClient;
  }

  try {
    logger.info(`Connecting to Redis: ${env.REDIS_URL.substring(0, 30)}...`);

    redisClient = new Redis(env.REDIS_URL, {
      // Connection settings
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,

      // Reconnection settings
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.debug(`Redis reconnect attempt ${times}, delay ${delay}ms`);
        return delay;
      },

      // Enable automatic connection
      enableOfflineQueue: true,

      // Command timeout
      commandTimeout: 5000,

      // TLS if needed (can be enabled via env)
      // tls: { rejectUnauthorized: false },
    });

    // Set up event listeners
    redisClient.on("connect", () => {
      logger.info("✅ Redis connected successfully");
    });

    redisClient.on("ready", () => {
      logger.info("✅ Redis ready for commands");
    });

    redisClient.on("error", (error) => {
      logger.error("❌ Redis error:", error);
    });

    redisClient.on("close", () => {
      logger.warn("⚠️ Redis connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("🔄 Redis reconnecting...");
    });

    // Test connection
    await redisClient.ping();
    logger.info("✅ Redis ping successful");

    return redisClient;
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
}

/**
 * Disconnect Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info("✅ Redis disconnected");
    } catch (error) {
      logger.error("Error disconnecting Redis:", error);
      throw error;
    }
  }
}

/**
 * Get current Redis client
 * @returns Redis client instance or null if not connected
 */
export function getRedis(): RedisClient | null {
  return redisClient;
}

/**
 * Check if Redis is connected
 * @returns True if connected and ready
 */
export async function isRedisConnected(): Promise<boolean> {
  if (!redisClient) return false;

  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

/**
 * Health check for Redis
 * @returns Object with connection status and diagnostics
 */
export async function redisHealthCheck(): Promise<{
  connected: boolean;
  status: string;
  error?: string;
}> {
  try {
    if (!redisClient) {
      return { connected: false, status: "not initialized" };
    }

    const pong = await redisClient.ping();
    await redisClient.info("server");

    return {
      connected: pong === "PONG",
      status: pong === "PONG" ? "healthy" : "unhealthy",
    };
  } catch (error) {
    return {
      connected: false,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default {
  connectRedis,
  disconnectRedis,
  getRedis,
  isRedisConnected,
  redisHealthCheck,
};
