import { z } from "zod";
import dotenv from "dotenv";

/**
 * Load environment variables from .env file
 */
dotenv.config();

const envSchema = z.object({
  // Application Configuration
  PORT: z.string().pipe(z.coerce.number().int().positive()).default("4000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database Configuration
  MONGODB_URI: z
    .string()
    .url("MONGODB_URI must be a valid MongoDB connection string"),

  // Cache & Queue Configuration
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis connection URL"),

  // LLM API Keys
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),

  // Semantic Cache Configuration
  SEMANTIC_CACHE_THRESHOLD: z
    .string()
    .pipe(z.coerce.number().min(0).max(1))
    .default("0.85"),
  SEMANTIC_CACHE_TTL_SECONDS: z
    .string()
    .pipe(z.coerce.number().positive())
    .default("604800"),

  // File Upload Configuration
  MAX_FILE_SIZE_MB: z.string().pipe(z.coerce.number().positive()).default("10"),

  // Rate Limiting Configuration
  RATE_LIMIT_PER_MINUTE: z
    .string()
    .pipe(z.coerce.number().positive().int())
    .default("20"),

  // CORS Configuration
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Logging Configuration
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

/**
 * Type inference for environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 * Exits process with code 1 if validation fails
 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error("");

    result.error.errors.forEach((err) => {
      const path = err.path.length > 0 ? err.path.join(".") : "unknown";
      console.error(`  📍 ${path}`);
      console.error(`     ${err.message}`);
    });

    console.error("");
    console.error("💡 Please check your .env file against .env.example");
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated environment variables
 * Safe to use throughout the application with full TypeScript typing
 */
export const env = loadEnv();

/**
 * Log environment info (safe values only)
 */
export function logEnvInfo(): void {
  console.info("📋 Environment Configuration:");
  console.info(`  NODE_ENV: ${env.NODE_ENV}`);
  console.info(`  PORT: ${env.PORT}`);
  console.info(`  LOG_LEVEL: ${env.LOG_LEVEL}`);
  console.info(`  MONGODB_URI: ${env.MONGODB_URI.substring(0, 20)}...`);
  console.info(`  REDIS_URL: ${env.REDIS_URL.substring(0, 20)}...`);
  console.info(`  MAX_FILE_SIZE_MB: ${env.MAX_FILE_SIZE_MB}`);
  console.info(`  RATE_LIMIT_PER_MINUTE: ${env.RATE_LIMIT_PER_MINUTE}`);
  console.info(`  SEMANTIC_CACHE_THRESHOLD: ${env.SEMANTIC_CACHE_THRESHOLD}`);
}

export default env;
