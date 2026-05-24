import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

/**
 * ========================
 * TypeScript Interfaces
 * ========================
 */

/**
 * Upload file information
 */
export interface UploadedFile {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  parsedText: string; // Already sanitized, max 8000 chars
  parseError?: string;
}

/**
 * Input section configuration
 */
export interface InputSection {
  name: string; // e.g., "Section A"
  count: number; // Number of questions (1-50)
  marksPerQ: number; // Marks per question (1-20)
  difficulty: "Easy" | "Moderate" | "Hard";
  type: "MCQ" | "ShortAnswer" | "LongAnswer" | "TrueFalse" | "FillInTheBlank";
  instruction?: string;
}

/**
 * Assignment input parameters
 */
export interface AssignmentInput {
  title: string;
  subject?: string;
  grade: string; // e.g., "Grade 10"
  dueDate?: Date;
  questionTypes: Array<
    "MCQ" | "ShortAnswer" | "LongAnswer" | "TrueFalse" | "FillInTheBlank"
  >;
  sections: InputSection[];
  instructions?: string;
  uploadedFile?: UploadedFile;
}

/**
 * Generated question object
 */
export interface GeneratedQuestion {
  number: number;
  text: string;
  type: "MCQ" | "ShortAnswer" | "LongAnswer" | "TrueFalse" | "FillInTheBlank";
  options?: string[]; // MCQ only
  difficulty: "Easy" | "Moderate" | "Hard";
  marks: number;
}

/**
 * Output section (generated)
 */
export interface OutputSection {
  name: string;
  instruction?: string;
  questions: GeneratedQuestion[];
}

/**
 * Assignment output (generated result)
 */
export interface AssignmentOutput {
  sections: OutputSection[];
  totalQuestions: number;
  totalMarks: number;
  pdfPath?: string;
  generatedAt: Date;
}

/**
 * Processing timing information
 */
export interface ProcessingTiming {
  queuedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

/**
 * Metadata about generation process
 */
export interface ProcessingMeta {
  modelUsed?: string;
  cacheHit: boolean;
  cacheSimilarity?: number;
  tokensIn?: number;
  tokensOut?: number;
  estimatedCostInr?: number;
  attempts: number;
  timing: ProcessingTiming;
}

/**
 * Full Assignment document interface
 */
export interface IAssignment extends Document {
  // System fields
  jobId: string;
  idempotencyKey?: string;
  status:
    | "queued"
    | "parsing"
    | "cached"
    | "generating"
    | "rendering"
    | "done"
    | "failed";
  progress: number;

  // Data
  input: AssignmentInput;
  output?: AssignmentOutput;
  meta: ProcessingMeta;
  errorMessage?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Edit history for per-question refinements
  edit_history?: EditEntry[];
}

/**
 * Edit history entry
 */
export interface EditEntry {
  timestamp: Date;
  sectionName: string;
  questionNumber: number;
  action: string;
  originalQuestion: GeneratedQuestion;
  newQuestion: GeneratedQuestion;
}

/**
 * ========================
 * Mongoose Schema
 * ========================
 */

// Processing Timing Schema
const processingTimingSchema = new Schema<ProcessingTiming>(
  {
    queuedAt: { type: Date, required: true, default: Date.now },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { _id: false },
);

// Processing Meta Schema
const processingMetaSchema = new Schema<ProcessingMeta>(
  {
    modelUsed: { type: String },
    cacheHit: { type: Boolean, default: false },
    cacheSimilarity: { type: Number, min: 0, max: 1 },
    tokensIn: { type: Number },
    tokensOut: { type: Number },
    estimatedCostInr: { type: Number },
    attempts: { type: Number, default: 0, min: 0 },
    timing: { type: processingTimingSchema, required: true },
  },
  { _id: false },
);

// Uploaded File Schema
const uploadedFileSchema = new Schema<UploadedFile>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    storedPath: { type: String, required: true },
    parsedText: { type: String, required: true, maxlength: 8000 },
    parseError: { type: String },
  },
  { _id: false },
);

// Input Section Schema
const inputSectionSchema = new Schema<InputSection>(
  {
    name: { type: String, required: true },
    count: { type: Number, required: true, min: 1, max: 50 },
    marksPerQ: { type: Number, required: true, min: 1, max: 20 },
    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Hard"],
      required: true,
    },
    type: {
      type: String,
      enum: ["MCQ", "ShortAnswer", "LongAnswer", "TrueFalse", "FillInTheBlank"],
      required: true,
    },
    instruction: { type: String },
  },
  { _id: false },
);

// Assignment Input Schema
const assignmentInputSchema = new Schema<AssignmentInput>(
  {
    title: { type: String, required: true, maxlength: 200 },
    subject: { type: String, maxlength: 100 },
    grade: { type: String, required: true }, // 'Grade 1' .. 'Grade 12'
    dueDate: { type: Date },
    questionTypes: [
      {
        type: String,
        enum: [
          "MCQ",
          "ShortAnswer",
          "LongAnswer",
          "TrueFalse",
          "FillInTheBlank",
        ],
      },
    ],
    sections: { type: [inputSectionSchema], required: true },
    instructions: { type: String, maxlength: 2000 },
    uploadedFile: { type: uploadedFileSchema },
  },
  { _id: false },
);

// Generated Question Schema
const generatedQuestionSchema = new Schema<GeneratedQuestion>(
  {
    number: { type: Number, required: true, min: 1 },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["MCQ", "ShortAnswer", "LongAnswer", "TrueFalse", "FillInTheBlank"],
      required: true,
    },
    options: [{ type: String }], // MCQ only
    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Hard"],
      required: true,
    },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// Output Section Schema
const outputSectionSchema = new Schema<OutputSection>(
  {
    name: { type: String, required: true },
    instruction: { type: String },
    questions: { type: [generatedQuestionSchema], required: true },
  },
  { _id: false },
);

// Assignment Output Schema
const assignmentOutputSchema = new Schema<AssignmentOutput>(
  {
    sections: { type: [outputSectionSchema], required: true },
    totalQuestions: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 0 },
    pdfPath: { type: String },
    generatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

// Main Assignment Schema
const assignmentSchema = new Schema<IAssignment>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => uuidv4(),
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "queued",
        "parsing",
        "cached",
        "generating",
        "rendering",
        "done",
        "failed",
      ],
      default: "queued",
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Data
    input: { type: assignmentInputSchema, required: true },
    output: { type: assignmentOutputSchema },
    meta: { type: processingMetaSchema, required: true },
    errorMessage: { type: String },
    // Edit history for per-question refinements
    edit_history: {
      type: [
        new Schema<EditEntry>(
          {
            timestamp: { type: Date, required: true, default: Date.now },
            sectionName: { type: String, required: true },
            questionNumber: { type: Number, required: true, min: 1 },
            action: { type: String, required: true },
            originalQuestion: { type: generatedQuestionSchema, required: true },
            newQuestion: { type: generatedQuestionSchema, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "assignments",
  },
);

/**
 * Indexes
 */
assignmentSchema.index({ createdAt: -1 }); // For recent assignments queries
assignmentSchema.index({ status: 1, createdAt: -1 }); // For status-based queries
assignmentSchema.index({ "meta.cacheHit": 1 }); // For cache analytics

/**
 * ========================
 * Model & Helpers
 * ========================
 */

/**
 * Mongoose model for Assignment
 */
export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema,
);

/**
 * Create a new assignment
 * @param input - Assignment input parameters
 * @param idempotencyKey - Optional idempotency key for request deduplication
 * @returns Created assignment document
 * @throws Mongoose validation error if input is invalid
 * @throws Duplicate key error if idempotencyKey already exists
 */
export async function createAssignment(
  input: AssignmentInput,
  idempotencyKey?: string,
): Promise<IAssignment> {
  const assignment = new Assignment({
    jobId: uuidv4(),
    idempotencyKey,
    status: "queued",
    progress: 0,
    input,
    meta: {
      cacheHit: false,
      attempts: 0,
      timing: {
        queuedAt: new Date(),
      },
    },
  });

  return assignment.save();
}

/**
 * Update an assignment (partial update)
 * @param jobId - Job ID to update
 * @param update - Partial update object
 * @returns Updated assignment or null if not found
 */
export async function updateAssignment(
  jobId: string,
  update: Partial<Omit<IAssignment, "createdAt" | "updatedAt">>,
): Promise<IAssignment | null> {
  return Assignment.findOneAndUpdate({ jobId }, update, { new: true });
}

/**
 * Get assignment by job ID
 * @param jobId - Job ID to retrieve
 * @returns Assignment document or null if not found
 */
export async function getAssignment(
  jobId: string,
): Promise<IAssignment | null> {
  return Assignment.findOne({ jobId });
}

/**
 * Find assignment by idempotency key
 * Useful for preventing duplicate requests
 * @param key - Idempotency key
 * @returns Assignment document or null if not found
 */
export async function findByIdempotencyKey(
  key: string,
): Promise<IAssignment | null> {
  return Assignment.findOne({ idempotencyKey: key });
}

/**
 * Delete assignment by job ID
 * @param jobId - Job ID to delete
 * @returns Deleted document or null if not found
 */
export async function deleteAssignment(
  jobId: string,
): Promise<IAssignment | null> {
  return Assignment.findOneAndDelete({ jobId });
}

/**
 * Find assignments by status
 * @param status - Status to filter
 * @param limit - Maximum number of results
 * @returns Array of assignments
 */
export async function findByStatus(
  status: IAssignment["status"],
  limit: number = 100,
): Promise<IAssignment[]> {
  return Assignment.find({ status }).limit(limit).sort({ createdAt: -1 });
}

/**
 * Find recent assignments
 * @param limit - Maximum number of results
 * @returns Array of recent assignments
 */
export async function findRecent(limit: number = 50): Promise<IAssignment[]> {
  return Assignment.find().limit(limit).sort({ createdAt: -1 });
}

/**
 * Count assignments by status
 * @param status - Status to count
 * @returns Count of assignments with given status
 */
export async function countByStatus(
  status: IAssignment["status"],
): Promise<number> {
  return Assignment.countDocuments({ status });
}

/**
 * Mark an assignment as started (update timing)
 * @param jobId - Job ID
 * @returns Updated assignment
 */
export async function markAsStarted(
  jobId: string,
): Promise<IAssignment | null> {
  return Assignment.findOneAndUpdate(
    { jobId },
    {
      $set: { "meta.timing.startedAt": new Date(), status: "generating" },
    },
    { new: true },
  );
}

/**
 * Mark an assignment as completed (update timing and status)
 * @param jobId - Job ID
 * @param output - Generated output
 * @returns Updated assignment
 */
export async function markAsCompleted(
  jobId: string,
  output: AssignmentOutput,
): Promise<IAssignment | null> {
  return Assignment.findOneAndUpdate(
    { jobId },
    {
      $set: {
        status: "done",
        progress: 100,
        output,
        "meta.timing.finishedAt": new Date(),
      },
    },
    { new: true },
  );
}

/**
 * Mark an assignment as failed
 * @param jobId - Job ID
 * @param errorMessage - Error message
 * @returns Updated assignment
 */
export async function markAsFailed(
  jobId: string,
  errorMessage: string,
): Promise<IAssignment | null> {
  return Assignment.findOneAndUpdate(
    { jobId },
    {
      $set: {
        status: "failed",
        errorMessage,
        "meta.timing.finishedAt": new Date(),
      },
      $inc: { "meta.attempts": 1 },
    },
    { new: true },
  );
}

/**
 * Update progress
 * @param jobId - Job ID
 * @param progress - Progress percentage (0-100)
 * @returns Updated assignment
 */
export async function updateProgress(
  jobId: string,
  progress: number,
): Promise<IAssignment | null> {
  if (progress < 0 || progress > 100) {
    throw new Error("Progress must be between 0 and 100");
  }
  return Assignment.findOneAndUpdate(
    { jobId },
    { $set: { progress } },
    { new: true },
  );
}

export default Assignment;
