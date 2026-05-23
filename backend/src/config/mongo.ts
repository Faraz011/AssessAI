import mongoose, { Connection } from "mongoose";
import { env } from "./env";
import { Assignment } from "../models/Assignment";
import { logger } from "../utils/logger";

/**
 * MongoDB Connection Manager
 * Handles connection setup, error handling, and lifecycle management
 */

let mongoConnection: Connection | null = null;

/**
 * Initialize MongoDB connection
 * @returns MongoDB connection instance
 */
export async function connectMongo(): Promise<Connection> {
  if (mongoConnection) {
    logger.info("Using existing MongoDB connection");
    return mongoConnection;
  }

  try {
    logger.info(
      `Connecting to MongoDB: ${env.MONGODB_URI.substring(0, 30)}...`,
    );

    const mongoose_instance = await mongoose.connect(env.MONGODB_URI, {
      // Connection pool size
      maxPoolSize: 10,
      minPoolSize: 5,

      // Timeouts
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,

      // Retry logic
      retryWrites: true,
      retryReads: true,

      // Automatic server discovery
      maxStalenessSeconds: 120,
    });

    mongoConnection = mongoose_instance.connection;

    // Set up event listeners
    mongoConnection.on("connected", () => {
      logger.info("✅ MongoDB connected successfully");
    });

    mongoConnection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB disconnected");
    });

    mongoConnection.on("error", (error) => {
      logger.error("❌ MongoDB connection error:", error);
    });

    mongoConnection.on("reconnected", () => {
      logger.info("🔄 MongoDB reconnected");
    });

    logger.info("✅ MongoDB initialized");
    return mongoConnection;
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Disconnect MongoDB
 */
export async function disconnectMongo(): Promise<void> {
  if (mongoConnection) {
    try {
      await mongoose.disconnect();
      mongoConnection = null;
      logger.info("✅ MongoDB disconnected");
    } catch (error) {
      logger.error("Error disconnecting MongoDB:", error);
      throw error;
    }
  }
}

/**
 * Ensure the MongoDB database matches the application schema
 * Creates required collections and syncs declared indexes.
 */
export async function ensureMongoSchema(): Promise<void> {
  if (!mongoConnection) {
    throw new Error("MongoDB must be connected before syncing schema");
  }

  logger.info("Synchronizing MongoDB collections and indexes...");

  await Assignment.createCollection();
  await Assignment.syncIndexes();

  logger.info("✅ MongoDB schema synchronized");
}

/**
 * Get current MongoDB connection
 * @returns Connection instance or null if not connected
 */
export function getMongo(): Connection | null {
  return mongoConnection;
}

/**
 * Check if MongoDB is connected
 * @returns True if connected
 */
export function isMongoConnected(): boolean {
  return mongoConnection?.readyState === 1; // 1 = connected
}

export default {
  connectMongo,
  disconnectMongo,
  getMongo,
  isMongoConnected,
  ensureMongoSchema,
};
