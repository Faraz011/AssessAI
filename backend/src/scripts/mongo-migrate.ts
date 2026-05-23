import {
  connectMongo,
  disconnectMongo,
  ensureMongoSchema,
} from "../config/mongo";
import { logger } from "../utils/logger";

async function main(): Promise<void> {
  try {
    logger.info("Starting MongoDB migration run...");
    await connectMongo();
    await ensureMongoSchema();
    logger.info("MongoDB migration completed successfully");
  } catch (error) {
    logger.error("MongoDB migration failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectMongo().catch((disconnectError) => {
      logger.error(
        "Failed to disconnect MongoDB after migration:",
        disconnectError,
      );
    });
  }
}

void main();
