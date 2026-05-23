import { z } from "zod";

/**
 * Request Validation Schemas using Zod
 * Type-safe runtime validation for all incoming API requests
 */

/**
 * Input section schema
 */
export const InputSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(100),
  count: z.number().int().min(1).max(50),
  marksPerQ: z.number().int().min(1).max(20),
  difficulty: z.enum(["Easy", "Moderate", "Hard"]),
  type: z.enum([
    "MCQ",
    "ShortAnswer",
    "LongAnswer",
    "TrueFalse",
    "FillInTheBlank",
  ]),
  instruction: z.string().max(500).optional(),
});

export type InputSection = z.infer<typeof InputSectionSchema>;

/**
 * Uploaded file schema (used after file parsing)
 */
export const UploadedFileSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().positive(),
  storedPath: z.string(),
  parsedText: z.string().max(8000),
  parseError: z.string().optional(),
});

export type UploadedFile = z.infer<typeof UploadedFileSchema>;

/**
 * Create assignment request schema
 */
export const CreateAssignmentRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters"),
  subject: z
    .string()
    .max(100, "Subject must be under 100 characters")
    .optional(),
  grade: z
    .string()
    .min(1, "Grade is required")
    .regex(/^Grade\s+\d+$/, 'Grade must be in format "Grade X"'),
  dueDate: z.coerce.date().optional(),
  questionTypes: z
    .array(
      z.enum([
        "MCQ",
        "ShortAnswer",
        "LongAnswer",
        "TrueFalse",
        "FillInTheBlank",
      ]),
      { errorMap: () => ({ message: "Invalid question type" }) },
    )
    .min(1, "At least one question type is required"),
  sections: z
    .array(InputSectionSchema)
    .min(1, "At least one section is required")
    .max(20, "Maximum 20 sections allowed"),
  instructions: z
    .string()
    .max(2000, "Instructions must be under 2000 characters")
    .optional(),
  uploadedFile: UploadedFileSchema.optional(),
});

export type CreateAssignmentRequest = z.infer<
  typeof CreateAssignmentRequestSchema
>;

/**
 * Validate create assignment request
 */
export function validateCreateAssignmentRequest(
  data: unknown,
):
  | { valid: true; data: CreateAssignmentRequest }
  | { valid: false; errors: string[] } {
  const result = CreateAssignmentRequestSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    return { valid: false, errors };
  }

  return { valid: true, data: result.data };
}

/**
 * Get assignment query schema
 */
export const GetAssignmentQuerySchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
});

export type GetAssignmentQuery = z.infer<typeof GetAssignmentQuerySchema>;

/**
 * Regenerate request schema
 */
export const RegenerateRequestSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
  sections: z
    .array(z.string())
    .optional()
    .describe("Optional: specify section names to regenerate (all if omitted)"),
  preserveMarks: z
    .boolean()
    .default(true)
    .describe("Preserve marks distribution from original"),
  preserveDifficulty: z
    .boolean()
    .default(true)
    .describe("Preserve difficulty distribution from original"),
});

export type RegenerateRequest = z.infer<typeof RegenerateRequestSchema>;

/**
 * Validate regenerate request
 */
export function validateRegenerateRequest(
  data: unknown,
):
  | { valid: true; data: RegenerateRequest }
  | { valid: false; errors: string[] } {
  const result = RegenerateRequestSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    return { valid: false, errors };
  }

  return { valid: true, data: result.data };
}

/**
 * Cancel request schema
 */
export const CancelRequestSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
});

export type CancelRequest = z.infer<typeof CancelRequestSchema>;

/**
 * Pagination query schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * List assignments query schema
 */
export const ListAssignmentsQuerySchema = PaginationQuerySchema.extend({
  status: z
    .enum([
      "queued",
      "parsing",
      "cached",
      "generating",
      "rendering",
      "done",
      "failed",
    ])
    .optional(),
});

export type ListAssignmentsQuery = z.infer<typeof ListAssignmentsQuerySchema>;

/**
 * Idempotency key validation
 */
export const IdempotencyKeySchema = z.string().uuid().optional();

export type IdempotencyKey = z.infer<typeof IdempotencyKeySchema>;

export default {
  CreateAssignmentRequestSchema,
  GetAssignmentQuerySchema,
  RegenerateRequestSchema,
  CancelRequestSchema,
  PaginationQuerySchema,
  ListAssignmentsQuerySchema,
  validateCreateAssignmentRequest,
  validateRegenerateRequest,
};
