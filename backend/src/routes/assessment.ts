/**
 * Section 9: Assessment API Routes
 * Handles assessment creation, status tracking, and PDF download
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { logger } from "../utils/logger";
import {
  createAssignment,
  getAssignment,
  countByStatus,
  Assignment,
  type AssignmentInput,
  type InputSection,
} from "../models/Assignment";
import { addJob, type QuestionGenerationJobData } from "../queue/producer";
import { parseFile, isSupportedFileType } from "../services/fileParser";
import { primaryBreaker } from "../llm/breaker";

/**
 * Configure multer for file uploads
 */
const uploadDir = path.join(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fsPromises.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (isSupportedFileType(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  },
});

const router = Router();

function parseFormValue<T>(value: unknown): T | undefined {
  if (typeof value !== "string") {
    return value as T | undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

/**
 * POST /api/assessment/create
 * Create a new assessment and enqueue it for processing
 * Returns 202 Accepted with jobId
 */
// @ts-expect-error - Express handler typing
router.post("/create", upload.single("file"), async (req, res, next) => {
  try {
    const startTime = Date.now();
    logger.info("POST /assessment/create", { body: req.body });

    // Validation
    const {
      title,
      grade,
      numQuestions,
      questionTypes,
      subject,
      dueDate,
      instructions,
    } = req.body;

    const parsedNumQuestions = parseFormValue<{
      sectionA?: unknown;
      sectionB?: unknown;
      sectionC?: unknown;
    }>(numQuestions);
    const parsedQuestionTypes =
      parseFormValue<AssignmentInput["questionTypes"]>(questionTypes);

    if (!title || typeof title !== "string") {
      return res
        .status(400)
        .json({ error: "title is required and must be a string" });
    }

    if (!grade || typeof grade !== "string") {
      return res
        .status(400)
        .json({ error: "grade is required and must be a string" });
    }

    if (!parsedNumQuestions || typeof parsedNumQuestions !== "object") {
      return res
        .status(400)
        .json({ error: "numQuestions is required and must be an object" });
    }

    // Parse numQuestions
    let sectionA = 5,
      sectionB = 5,
      sectionC = 5;
    if (parsedNumQuestions) {
      const nextSectionA = Number(parsedNumQuestions.sectionA);
      const nextSectionB = Number(parsedNumQuestions.sectionB);
      const nextSectionC = Number(parsedNumQuestions.sectionC);

      if (Number.isFinite(nextSectionA)) sectionA = nextSectionA;
      if (Number.isFinite(nextSectionB)) sectionB = nextSectionB;
      if (Number.isFinite(nextSectionC)) sectionC = nextSectionC;
    }

    // Validate section counts
    if (
      sectionA < 1 ||
      sectionA > 50 ||
      sectionB < 1 ||
      sectionB > 50 ||
      sectionC < 1 ||
      sectionC > 50
    ) {
      return res
        .status(400)
        .json({ error: "Section counts must be between 1 and 50" });
    }

    // Process file if uploaded
    let uploadedFileData = null;
    if (req.file) {
      try {
        const fileType = path
          .extname(req.file.filename)
          .toLowerCase()
          .slice(1) as any;
        const parseResult = await parseFile(req.file.path, fileType);

        if (!parseResult.success) {
          await fsPromises.unlink(req.file.path).catch(() => {});
          return res
            .status(400)
            .json({ error: `Failed to parse file: ${parseResult.error}` });
        }

        uploadedFileData = {
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          storedPath: req.file.path,
          parsedText: parseResult.content.substring(0, 8000), // Max 8000 chars
        };
      } catch (error) {
        await fsPromises.unlink(req.file.path).catch(() => {});
        logger.error("File parsing error:", error);
        return res
          .status(400)
          .json({ error: "Failed to process uploaded file" });
      }
    }

    // Build sections array
    const sections: InputSection[] = [
      {
        name: "Section A",
        count: sectionA,
        marksPerQ: 2,
        difficulty: "Easy",
        type: (parsedQuestionTypes?.[0] || "MCQ") as InputSection["type"],
      },
      {
        name: "Section B",
        count: sectionB,
        marksPerQ: 3,
        difficulty: "Moderate",
        type: (parsedQuestionTypes?.[1] ||
          "ShortAnswer") as InputSection["type"],
      },
      {
        name: "Section C",
        count: sectionC,
        marksPerQ: 5,
        difficulty: "Hard",
        type: (parsedQuestionTypes?.[2] ||
          "LongAnswer") as InputSection["type"],
      },
    ];

    // Create assignment input
    const assignmentInput: AssignmentInput = {
      title,
      subject: subject || undefined,
      grade,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      questionTypes: parsedQuestionTypes || [
        "MCQ" as AssignmentInput["questionTypes"][number],
      ],
      sections,
      instructions: instructions || undefined,
      uploadedFile: uploadedFileData || undefined,
    };

    // Create assignment in database
    const assignment = await createAssignment(assignmentInput);
    logger.info("Assignment created", { jobId: assignment.jobId });

    // Prepare queue job
    const jobData: QuestionGenerationJobData = {
      jobId: assignment.jobId,
      title,
      subject: subject || undefined,
      grade,
      numQuestions: sectionA + sectionB + sectionC,
      questionTypes: parsedQuestionTypes || ["MCQ"],
      instructions: instructions || undefined,
      fileContent: uploadedFileData?.parsedText || undefined,
    };

    // Enqueue job
    await addJob(jobData);

    const duration = Date.now() - startTime;
    logger.info("Job enqueued", { jobId: assignment.jobId, duration });

    // Return 202 Accepted
    res.status(202).json({
      jobId: assignment.jobId,
      status: "queued",
      message: "Your assessment is being generated",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/assessment/status/:jobId
 * Get the status and details of an assessment job
 */
// @ts-expect-error - Express handler typing
router.get("/status/:jobId", async (_req, res, next) => {
  try {
    const { jobId } = _req.params;
    logger.info("GET /assessment/status", { jobId });

    const assignment = await getAssignment(jobId);

    if (!assignment) {
      return res.status(404).json({ error: "Job not found" });
    }

    const response: any = {
      jobId: assignment.jobId,
      status: assignment.status,
      progress: assignment.progress,
      metadata: {
        modelUsed: assignment.meta.modelUsed,
        cacheHit: assignment.meta.cacheHit,
        cacheSimilarity: assignment.meta.cacheSimilarity,
        attempts: assignment.meta.attempts,
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };

    // Include result if done
    if (assignment.status === "done" && assignment.output) {
      response.result = {
        sections: assignment.output.sections,
        totalQuestions: assignment.output.totalQuestions,
        totalMarks: assignment.output.totalMarks,
        pdfPath: assignment.output.pdfPath,
        generatedAt: assignment.output.generatedAt,
      };
      response.downloadUrl = `/api/assessment/download/${jobId}`;
    }

    // Include input metadata for display
    response.input = {
      title: assignment.input.title,
      subject: assignment.input.subject,
      grade: assignment.input.grade,
      instructions: assignment.input.instructions,
      sections: assignment.input.sections,
    };

    // Include error if failed
    if (assignment.status === "failed") {
      response.error = assignment.errorMessage || "Unknown error";
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/assessment/download/:jobId
 * Download the generated PDF for a completed assessment
 */
router.get("/download/:jobId", async (_req, res, next) => {
  try {
    const { jobId } = _req.params;
    logger.info("GET /assessment/download", { jobId });

    const assignment = await getAssignment(jobId);

    if (!assignment) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (assignment.status !== "done" || !assignment.output?.pdfPath) {
      res.status(400).json({ error: "Assessment not ready for download" });
      return;
    }

    // Verify file exists
    const pdfPath = assignment.output.pdfPath;
    try {
      await fsPromises.access(pdfPath);
    } catch {
      logger.error("PDF file not found:", { pdfPath, jobId });
      res.status(404).json({ error: "PDF file not found" });
      return;
    }

    // Set response headers
    const filename = `${assignment.input.title}-Grade${assignment.input.grade}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream the file
    const stream = fs.createReadStream(pdfPath);
    stream.on("error", (error: Error) => {
      logger.error("Error streaming PDF:", error);
      res.status(500).json({ error: "Error downloading file" });
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/assessment/stats
 * Get aggregate statistics about assessment processing
 */
router.get("/stats", async (_req, res, next) => {
  try {
    logger.info("GET /assessment/stats");

    // Get counts by status
    const doneJobs = await countByStatus("done");
    const failedJobs = await countByStatus("failed");
    const totalJobs = await Assignment.countDocuments();

    // Get cache hit rate
    const cacheHitCount = await Assignment.countDocuments({
      "meta.cacheHit": true,
    });
    const cacheHitRate =
      totalJobs > 0 ? Math.round((cacheHitCount / totalJobs) * 100) : 0;

    // Get average generation time
    const completedJobs = await Assignment.find({
      "meta.timing.finishedAt": { $exists: true },
      "meta.timing.startedAt": { $exists: true },
    });

    let avgGenerationTimeMs = 0;
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        const started = new Date(job.meta.timing.startedAt!).getTime();
        const finished = new Date(job.meta.timing.finishedAt!).getTime();
        return sum + (finished - started);
      }, 0);
      avgGenerationTimeMs = Math.round(totalTime / completedJobs.length);
    }

    // Get circuit breaker state
    const breakerState = primaryBreaker.getState();

    res.json({
      totalJobs,
      doneJobs,
      failedJobs,
      cacheHitRate,
      avgGenerationTimeMs,
      breakerState,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/assessment/cost-projection
 * Calculate cost projections for scaling from current to target user base
 * Returns detailed breakdown of monthly costs and savings with caching benefits
 */
router.get("/cost-projection", async (_req, res, next) => {
  try {
    logger.info("GET /assessment/cost-projection");

    // Hardcoded scenario parameters
    const currentUsers = 1000;
    const targetUsers = 5000;
    const teacherFraction = 0.6; // 60% of users are teachers
    const assessmentsPerTeacherPerWeek = 3;
    const weeksPerMonth = 4.3;
    const currentCostPerAssessment = 12; // ₹ (with GPT-4)
    const newCostPerAssessment = 3.5; // ₹ (with Haiku + caching)
    const expectedCacheHitRate = 0.5; // 50% cache hit rate (realistic for EdTech topic repetition)

    // Calculate monthly assessments
    const currentMonthlyAssessments =
      currentUsers *
      teacherFraction *
      assessmentsPerTeacherPerWeek *
      weeksPerMonth;
    const targetMonthlyAssessments =
      targetUsers *
      teacherFraction *
      assessmentsPerTeacherPerWeek *
      weeksPerMonth;

    // Calculate costs at current scale
    const currentMonthlyCost =
      currentMonthlyAssessments * currentCostPerAssessment;

    // Calculate costs at target scale (old system)
    const targetMonthlyCostOld =
      targetMonthlyAssessments * currentCostPerAssessment;

    // Calculate effective assessments with caching
    const cachedAssessments = targetMonthlyAssessments * expectedCacheHitRate;
    const nonCachedAssessments =
      targetMonthlyAssessments * (1 - expectedCacheHitRate);
    const targetMonthlyCostNew = nonCachedAssessments * newCostPerAssessment;

    // Calculate savings
    const monthlySavings = targetMonthlyCostOld - targetMonthlyCostNew;
    const savingsPercent = (monthlySavings / targetMonthlyCostOld) * 100;

    // Annual projections
    const annualSavings = monthlySavings * 12;

    res.json({
      scenario: {
        currentUsers,
        targetUsers,
        teacherFraction: `${(teacherFraction * 100).toFixed(0)}%`,
        assessmentsPerTeacherPerWeek,
        expectedCacheHitRate: `${(expectedCacheHitRate * 100).toFixed(0)}%`,
      },
      currentScale: {
        monthlyAssessments: Math.round(currentMonthlyAssessments),
        monthlyCost: `₹${currentMonthlyCost.toFixed(2)}`,
        monthlyCostNumeric: Number(currentMonthlyCost.toFixed(2)),
      },
      targetScale: {
        monthlyAssessments: Math.round(targetMonthlyAssessments),
        cachedAssessments: Math.round(cachedAssessments),
        nonCachedAssessments: Math.round(nonCachedAssessments),
        oldSystemMonthlyCost: `₹${targetMonthlyCostOld.toFixed(2)}`,
        oldSystemMonthlyCostNumeric: Number(targetMonthlyCostOld.toFixed(2)),
        newSystemMonthlyCost: `₹${targetMonthlyCostNew.toFixed(2)}`,
        newSystemMonthlyCostNumeric: Number(targetMonthlyCostNew.toFixed(2)),
      },
      savings: {
        monthlySavings: `₹${monthlySavings.toFixed(2)}`,
        monthlySavingsNumeric: Number(monthlySavings.toFixed(2)),
        savingsPercent: Number(savingsPercent.toFixed(2)),
        annualSavings: `₹${annualSavings.toFixed(2)}`,
        annualSavingsNumeric: Number(annualSavings.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
