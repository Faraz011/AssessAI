/**
 * BullMQ Queue Worker
 * Processes question generation jobs
 */

import { Worker } from "bullmq";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { QuestionGenerationJobData } from "./producer";
import { getAssignment, updateAssignment } from "../models/Assignment";
import { generateQuestionPaper } from "../generator/questionPaper";
import { generatePDF } from "../services/pdfGenerator";

let worker: Worker<QuestionGenerationJobData> | null = null;

/**
 * Start the question generation worker
 * Handles concurrent job processing with graceful shutdown
 */
export async function startWorker(): Promise<
  Worker<QuestionGenerationJobData>
> {
  if (worker) {
    logger.info("Worker already running");
    return worker;
  }

  try {
    logger.info("Starting BullMQ worker for question generation");

    worker = new Worker<QuestionGenerationJobData>(
      "question-generation",
      async (job) => {
        const jobData = job.data;
        const startTime = Date.now();

        try {
          logger.info(`Processing job ${job.id}`, {
            assignmentJobId: jobData.jobId,
          });

          // Step 1: Update DB status to 'processing'
          await updateAssignment(jobData.jobId, {
            status: "generating",
            progress: 10,
          });
          logger.info(`Updated assignment ${jobData.jobId} to generating`);

          // Step 2: Update job progress
          await job.updateProgress(10);

          // Step 3: Generate question paper
          logger.info(`Generating questions for ${jobData.jobId}...`);
          const assignment = await getAssignment(jobData.jobId);
          if (!assignment) {
            throw new Error(`Assignment not found for job ${jobData.jobId}`);
          }

          const questionPaperResult = await generateQuestionPaper({
            jobId: jobData.jobId,
            title: assignment.input.title,
            subject: assignment.input.subject,
            grade: assignment.input.grade,
            sections: assignment.input.sections,
            questionTypes: assignment.input.questionTypes,
            instructions: assignment.input.instructions || jobData.instructions,
            fileContent:
              assignment.input.uploadedFile?.parsedText || jobData.fileContent,
          });

          const questionPaper = questionPaperResult.questionPaper;

          // Render the generated paper to PDF before marking the job complete.
          await updateAssignment(jobData.jobId, {
            status: "rendering",
            progress: 92,
          });
          await job.updateProgress(92);

          const pdfQuestionPaper = {
            ...questionPaper,
            sections: questionPaper.sections.map((section) => ({
              ...section,
              instruction: section.instruction || "Attempt all questions.",
            })),
          };

          const pdfResult = await generatePDF(pdfQuestionPaper, {
            jobId: jobData.jobId,
            title: assignment.input.title,
            subject: assignment.input.subject,
            grade: assignment.input.grade,
            date: new Date(),
          });

          const questionPaperWithPdf = {
            ...questionPaper,
            pdfPath: pdfResult.filePath,
          };

          await job.updateProgress(98);

          // Step 4: Update DB status to 'done' with result
          await updateAssignment(jobData.jobId, {
            status: "done",
            output: questionPaperWithPdf,
            progress: 100,
          });

          logger.info(`Completed job ${job.id}`, {
            assignmentJobId: jobData.jobId,
            totalQuestions: questionPaper.totalQuestions,
            totalMarks: questionPaper.totalMarks,
            duration: `${Date.now() - startTime}ms`,
          });

          return {
            success: true,
            questionPaper: questionPaperWithPdf,
          };
        } catch (error) {
          logger.error(`Job ${job.id} failed`, {
            assignmentJobId: jobData.jobId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });

          // Step 5: Update DB status to 'failed' with error message
          try {
            await updateAssignment(jobData.jobId, {
              status: "failed",
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
              progress: 0,
            });
          } catch (updateError) {
            logger.error(
              "Failed to update assignment status to failed:",
              updateError,
            );
          }

          // Re-throw for BullMQ retry mechanism
          throw error;
        }
      },
      {
        connection: {
          url: env.REDIS_URL,
          lazyConnect: false,
        },
        concurrency: 3,
      },
    );

    // Set up worker event listeners
    worker.on("error", (error) => {
      logger.error("Worker error:", error);
    });

    worker.on("failed", (job, error) => {
      logger.error(`Job ${job?.id} failed permanently after retries`, {
        error: error?.message,
      });
    });

    worker.on("completed", (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on("active", (job) => {
      logger.debug(`Job ${job.id} is now active`);
    });

    logger.info("✅ BullMQ worker started with concurrency: 3");
    return worker;
  } catch (error) {
    logger.error("Failed to start worker:", error);
    throw error;
  }
}

/**
 * Close the worker gracefully
 */
export async function closeWorker(): Promise<void> {
  if (worker) {
    try {
      logger.info("Shutting down worker gracefully...");
      await worker.close();
      worker = null;
      logger.info("✅ Worker closed");
    } catch (error) {
      logger.error("Error closing worker:", error);
      throw error;
    }
  }
}

/**
 * Get the current worker instance
 */
export function getWorker(): Worker<QuestionGenerationJobData> | null {
  return worker;
}

/**
 * Set up graceful shutdown on SIGTERM
 */
export function setupGracefulShutdown(): void {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.warn(`Received ${signal}, shutting down gracefully...`);

      try {
        // Close worker first
        await closeWorker();

        // Give remaining jobs time to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));

        logger.info("✅ Graceful shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    });
  });
}

export default {
  startWorker,
  closeWorker,
  getWorker,
  setupGracefulShutdown,
};
