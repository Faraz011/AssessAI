/**
 * BullMQ Queue Producer
 * Handles job enqueueing with deduplication
 */

import { Queue } from "bullmq";
import type { Queue as QueueType } from "bullmq";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Job data shape for question generation
 */
export interface QuestionGenerationJobData {
  jobId: string;
  title: string;
  subject?: string;
  grade: string;
  numQuestions: number;
  questionTypes: string[];
  instructions?: string;
  fileContent?: string;
}

/**
 * Global queue instance
 */
let questionQueue: QueueType<QuestionGenerationJobData> | null = null;

/**
 * Initialize the question generation queue
 * @returns Queue instance
 */
export function initializeQueue(): QueueType<QuestionGenerationJobData> {
  if (questionQueue) {
    logger.debug("Using existing question queue");
    return questionQueue;
  }

  try {
    logger.info(
      `Initializing BullMQ queue: redis://${env.REDIS_URL.substring(0, 30)}...`,
    );

    questionQueue = new Queue<QuestionGenerationJobData>(
      "question-generation",
      {
        connection: {
          url: env.REDIS_URL,
          lazyConnect: false,
        },
      },
    );

    // Set up queue event listeners
    questionQueue.on("error", (error) => {
      logger.error("Queue error:", error);
    });

    questionQueue.on("paused", () => {
      logger.info("Queue paused");
    });

    questionQueue.on("resumed", () => {
      logger.info("Queue resumed");
    });

    logger.info("✅ BullMQ queue initialized successfully");
    return questionQueue;
  } catch (error) {
    logger.error("Failed to initialize BullMQ queue:", error);
    throw error;
  }
}

/**
 * Get the current queue instance
 * @returns Queue instance or null if not initialized
 */
export function getQueue(): QueueType<QuestionGenerationJobData> | null {
  return questionQueue;
}

/**
 * Deduplication key generator
 * Creates a unique identifier based on title, subject, grade, and numQuestions
 * @param jobData - Job data to generate key from
 * @returns Deduplication key
 */
function generateDeduplicationKey(jobData: QuestionGenerationJobData): string {
  const { title, subject, grade, numQuestions } = jobData;
  return `${title}::${subject || ""}::${grade}::${JSON.stringify(numQuestions)}`;
}

/**
 * Check if a job with identical parameters already exists
 * @param jobData - Job data to check
 * @returns Existing Bull job ID if found, null otherwise
 */
async function findDuplicateJob(
  jobData: QuestionGenerationJobData,
): Promise<string | null> {
  const queue = getQueue();
  if (!queue) {
    logger.warn("Queue not initialized, cannot check for duplicates");
    return null;
  }

  try {
    const dedupeKey = generateDeduplicationKey(jobData);

    // Check active and waiting jobs
    const activeJobs = await queue.getJobs(["active", "waiting"]);

    for (const job of activeJobs) {
      if (job.data) {
        const existingKey = generateDeduplicationKey(job.data);
        if (existingKey === dedupeKey) {
          logger.info(`Found duplicate job: ${job.id}, reusing it`);
          return job.id as string;
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn("Error checking for duplicate jobs:", error);
    return null;
  }
}

/**
 * Add a job to the question generation queue
 * Includes deduplication logic: returns existing job ID if same params found
 * @param jobData - Job data for question generation
 * @returns BullMQ job ID
 */
export async function addJob(
  jobData: QuestionGenerationJobData,
): Promise<string> {
  const queue = getQueue();
  if (!queue) {
    throw new Error("Queue not initialized");
  }

  try {
    // Check for existing job with same parameters
    const existingJobId = await findDuplicateJob(jobData);
    if (existingJobId) {
      logger.info(
        `Returning existing job ID for deduped job: ${existingJobId}`,
      );
      return existingJobId;
    }

    // Add new job with retry and cleanup settings
    const job = await queue.add("generate", jobData, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep for 1 hour
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
      // Store job in a way that's recoverable
      jobId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    const jobId = job.id || "unknown";
    logger.info(`Added job to queue: ${jobId}`, {
      assignmentJobId: jobData.jobId,
    });
    return jobId;
  } catch (error) {
    logger.error("Failed to add job to queue:", error);
    throw error;
  }
}

/**
 * Get job status from queue
 * @param jobId - BullMQ job ID
 * @returns Job data or null if not found
 */
export async function getJobStatus(jobId: string) {
  const queue = getQueue();
  if (!queue) {
    throw new Error("Queue not initialized");
  }

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  } catch (error) {
    logger.error("Failed to get job status:", error);
    throw error;
  }
}

/**
 * Close the queue
 */
export async function closeQueue(): Promise<void> {
  if (questionQueue) {
    try {
      await questionQueue.close();
      questionQueue = null;
      logger.info("✅ Queue closed");
    } catch (error) {
      logger.error("Error closing queue:", error);
      throw error;
    }
  }
}

export default {
  initializeQueue,
  getQueue,
  addJob,
  getJobStatus,
  closeQueue,
};
