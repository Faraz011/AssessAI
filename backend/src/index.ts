/**
 * VedaAI Backend - Entry Point
 * Initializes Express, MongoDB, Redis, Bull Queue, WebSocket, and Worker
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { env, logEnvInfo } from "./config/env";
import {
  connectMongo,
  ensureMongoSchema,
  isMongoConnected,
} from "./config/mongo";
import { connectRedis, isRedisConnected } from "./config/redis";
import { logger } from "./utils/logger";
import assessmentRouter from "./routes/assessment";
import { initializeQueue } from "./queue/producer";
import { startWorker } from "./queue/worker";
import { initializeWebSocket } from "./utils/websocket";

/**
 * Initialize the Express application
 */
function initializeApp(httpServer: any): Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Initialize WebSocket
  initializeWebSocket(httpServer);
  logger.info("WebSocket initialized on /ws");

  // Health check endpoint
  app.get("/health", async (_req: Request, res: Response) => {
    const mongoConnected = isMongoConnected();
    const redisConnected = await isRedisConnected();

    const health = {
      status: mongoConnected && redisConnected ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoConnected ? "connected" : "disconnected",
        redis: redisConnected ? "connected" : "disconnected",
      },
    };

    const statusCode = mongoConnected && redisConnected ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Ready check (all services must be ready)
  app.get("/ready", async (_req: Request, res: Response) => {
    const mongoConnected = isMongoConnected();
    const redisConnected = await isRedisConnected();

    if (mongoConnected && redisConnected) {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({
        ready: false,
        reason: !mongoConnected
          ? "MongoDB not connected"
          : "Redis not connected",
      });
    }
  });

  // API Routes
  app.use("/api/assessment", assessmentRouter);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    logger.info("🚀 Starting VedaAI Backend...");
    logEnvInfo();

    // Connect to external services
    logger.info("📦 Connecting to external services...");
    await connectMongo();
    await ensureMongoSchema();
    await connectRedis();

    // Initialize queue and worker
    logger.info("⚙️ Initializing BullMQ queue and worker...");
    initializeQueue();
    await startWorker();
    logger.info("✅ Queue and worker initialized");

    // Initialize Express app
    logger.info("⚙️ Initializing Express app...");
    const { createServer } = await import("http");
    const httpServer = createServer();
    const app = initializeApp(httpServer);

    // Attach Express to HTTP server
    httpServer.on("request", app);

    // Start listening
    const port = env.PORT;
    await new Promise<void>((resolve) => {
      httpServer.listen(port, () => {
        logger.info(`✅ Server listening on port ${port}`);
        logger.info(`📊 Environment: ${env.NODE_ENV}`);
        logger.info("✨ Backend is ready to accept requests");
        resolve();
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
