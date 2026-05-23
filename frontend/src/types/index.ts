/**
 * Shared Type Definitions
 * Imported from backend Zod schemas via z.infer
 * Frontend and Backend use the EXACT same shape
 */

/**
 * Question Paper Output Types
 * These types come from backend/src/schemas/questionPaper.ts
 */

export type Difficulty = "Easy" | "Moderate" | "Hard";
export type QuestionType =
  | "MCQ"
  | "ShortAnswer"
  | "LongAnswer"
  | "TrueFalse"
  | "FillInTheBlank";

/**
 * Question type - validated by Zod in backend
 */
export interface Question {
  number: number;
  text: string;
  type: QuestionType;
  options?: string[];
  difficulty: Difficulty;
  marks: number;
}

/**
 * Section type - validated by Zod in backend
 */
export interface Section {
  name: string;
  instruction: string;
  questions: Question[];
}

/**
 * Full question paper - validated by Zod in backend
 * Ensures: totalQuestions = sum of questions, totalMarks = sum of marks, numbering is 1..N per section
 */
export interface QuestionPaper {
  sections: Section[];
  totalQuestions: number;
  totalMarks: number;
  pdfPath?: string;
  generatedAt?: Date;
}

/**
 * Request Input Types
 * These types come from backend/src/schemas/request.ts
 */

/**
 * Input section for assignment creation
 */
export interface InputSection {
  name: string;
  count: number; // VALIDATED: min 1, max 50 (rejects negative/zero)
  marksPerQ: number;
  difficulty: Difficulty;
  type: QuestionType;
  instruction?: string;
}

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  parsedText: string;
  parseError?: string;
}

/**
 * Create assignment request body
 * VALIDATED by backend Zod schema
 */
export interface CreateAssignmentRequest {
  title: string; // VALIDATED: required, 1-200 chars
  subject?: string;
  grade: string; // VALIDATED: required, format "Grade X"
  dueDate?: Date;
  questionTypes: QuestionType[]; // VALIDATED: min 1
  sections: InputSection[]; // VALIDATED: min 1 section, each with count >= 1
  instructions?: string;
  uploadedFile?: UploadedFile;
}

/**
 * Get assignment query parameters
 */
export interface GetAssignmentQuery {
  jobId: string; // UUID format
}

/**
 * Regenerate assignment request
 */
export interface RegenerateRequest {
  jobId: string; // UUID format
  sections?: string[];
  preserveMarks?: boolean;
  preserveDifficulty?: boolean;
}

/**
 * Cancel assignment request
 */
export interface CancelRequest {
  jobId: string; // UUID format
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page: number;
  limit: number;
  sort: "createdAt" | "updatedAt";
  order: "asc" | "desc";
}

/**
 * List assignments query parameters
 */
export interface ListAssignmentsQuery extends PaginationQuery {
  status?:
    | "queued"
    | "parsing"
    | "cached"
    | "generating"
    | "rendering"
    | "done"
    | "failed";
}

/**
 * Assignment Status
 */
export type AssignmentStatus =
  | "queued"
  | "parsing"
  | "cached"
  | "generating"
  | "rendering"
  | "done"
  | "failed";

/**
 * Assignment Document (from MongoDB)
 */
export interface Assignment {
  _id?: string;
  jobId: string; // Unique per assignment
  idempotencyKey?: string; // Sparse unique for preventing duplicates
  title: string;
  subject?: string;
  grade: string;
  input: {
    sections: InputSection[];
    totalSections: number;
    estimatedTotalQuestions: number;
  };
  output?: QuestionPaper;
  status: AssignmentStatus;
  progress: number; // 0-100
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response Types
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  services: {
    mongodb: "connected" | "disconnected";
    redis: "connected" | "disconnected";
  };
}

export interface ReadyResponse {
  ready: boolean;
  reason?: string;
}

/**
 * Cost Estimation Type
 */
export interface CostEstimation {
  costUsd: number;
  costInr: number;
}

/**
 * Assignment Response Type
 * Used for API responses and real-time status updates
 */
export interface AssignmentResponse {
  jobId: string;
  status: AssignmentStatus;
  progress: number; // 0-100
  metadata?: {
    model?: string;
    modelUsed?: string;
    attempts?: number;
    cacheHit?: boolean;
    cacheSimilarity?: number;
  };
  result?: QuestionPaper;
  error?: string;
  downloadUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  input?: {
    title: string;
    subject?: string;
    grade: string;
    instructions?: string;
    sections: InputSection[];
  };
}

/**
 * Student Information Type
 * Used in question paper headers for student info section
 */
export interface StudentInfo {
  name: string;
  rollNumber: string;
  section: string;
  date: string;
}

/**
 * WebSocket Message Type
 * Used for real-time updates from backend
 */
export interface WebSocketMessage {
  type: "progress" | "completed" | "error" | "subscribed";
  jobId: string;
  data?: {
    progress?: number;
    result?: QuestionPaper;
    error?: string;
  };
}
