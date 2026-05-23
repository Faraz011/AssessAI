import { z } from "zod";

/**
 * Question Paper Output Validation Schemas
 * LLM Output Contract: Protects UI from raw LLM garbage
 * CRITICAL: Backend MUST validate every field before database save
 */

/**
 * Enums for type safety
 */
export const DifficultyEnum = z.enum(["Easy", "Moderate", "Hard"]);
export const QuestionTypeEnum = z.enum([
  "MCQ",
  "ShortAnswer",
  "LongAnswer",
  "TrueFalse",
  "FillInTheBlank",
]);

/**
 * Individual question schema - Core validation contract
 */
export const QuestionSchema = z
  .object({
    number: z.number().int().positive("Question number must be positive"),
    text: z
      .string()
      .min(5, "Question text must be at least 5 chars")
      .max(800, "Question text must be at most 800 chars"),
    type: QuestionTypeEnum,
    options: z.array(z.string().min(1).max(200)).length(4).optional(),
    difficulty: DifficultyEnum,
    marks: z
      .number()
      .positive("Marks must be positive")
      .max(20, "Max 20 marks per question"),
  })
  .refine((q) => q.type !== "MCQ" || (q.options && q.options.length === 4), {
    message: "MCQ must have exactly 4 options",
  });

export type Question = z.infer<typeof QuestionSchema>;

/**
 * Section schema with name validation
 */
export const SectionSchema = z.object({
  name: z
    .string()
    .regex(
      /^Section [A-Z]$/,
      'Section name must be "Section A", "Section B", etc.',
    ),
  instruction: z
    .string()
    .min(5, "Instruction must be at least 5 chars")
    .max(300, "Instruction must be at most 300 chars"),
  questions: z
    .array(QuestionSchema)
    .min(1)
    .max(50, "Max 50 questions per section"),
});

export type Section = z.infer<typeof SectionSchema>;

/**
 * Full question paper schema with cross-field validation
 * Validates LLM output math: totalQuestions and totalMarks must match computed sums
 * Validates numbering: questions must be numbered 1..N per section with no gaps
 */
export const QuestionPaperSchema = z
  .object({
    sections: z.array(SectionSchema).min(1).max(6, "Max 6 sections"),
    totalQuestions: z.number().int().positive(),
    totalMarks: z.number().positive(),
    pdfPath: z.string().optional(),
    generatedAt: z.coerce.date().optional(),
  })
  .superRefine((paper, ctx) => {
    // Validate AI math: totalQuestions
    const computedQ = paper.sections.reduce(
      (sum, sec) => sum + sec.questions.length,
      0,
    );
    if (computedQ !== paper.totalQuestions) {
      ctx.addIssue({
        code: "custom",
        path: ["totalQuestions"],
        message: `totalQuestions mismatch: claimed ${paper.totalQuestions}, actual ${computedQ}`,
      });
    }

    // Validate AI math: totalMarks
    const computedM = paper.sections.reduce(
      (sum, sec) => sum + sec.questions.reduce((qs, q) => qs + q.marks, 0),
      0,
    );
    if (computedM !== paper.totalMarks) {
      ctx.addIssue({
        code: "custom",
        path: ["totalMarks"],
        message: `totalMarks mismatch: claimed ${paper.totalMarks}, actual ${computedM}`,
      });
    }

    // Validate question numbering: 1..N per section, no gaps
    for (const sec of paper.sections) {
      sec.questions.forEach((q, i) => {
        if (q.number !== i + 1) {
          ctx.addIssue({
            code: "custom",
            path: ["sections"],
            message: `${sec.name} Q${i + 1} numbered ${q.number}`,
          });
        }
      });
    }
  })
  .refine(
    (data) => {
      // Verify total marks matches sum of question marks
      const actualTotal = data.sections.reduce(
        (sum, section) =>
          section.questions.reduce(
            (sectionSum, q) => sectionSum + q.marks,
            sum,
          ),
        0,
      );
      return actualTotal === data.totalMarks;
    },
    {
      message: "totalMarks must match the sum of all question marks",
      path: ["totalMarks"],
    },
  );

export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;

/**
 * Validate question paper
 * @param data - Raw question paper data
 * @returns Validation result with typed data or errors
 */
export function validateQuestionPaper(
  data: unknown,
): { valid: true; data: QuestionPaper } | { valid: false; errors: string[] } {
  const result = QuestionPaperSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}` : "root";
      return `${path}: ${err.message}`;
    });
    return { valid: false, errors };
  }

  return { valid: true, data: result.data };
}

/**
 * Schema for LLM response parsing
 * Relaxed schema for initial JSON extraction before repair
 */
export const LLMResponseSchema = z.object({
  sections: z.array(z.any()).optional(),
  totalQuestions: z.any().optional(),
  totalMarks: z.any().optional(),
  pdfPath: z.any().optional(),
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

/**
 * Cost estimation schema
 */
export const CostEstimationSchema = z.object({
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  modelCostPerMInput: z.number().positive(),
  modelCostPerMOutput: z.number().positive(),
  exchangeRate: z.number().positive().default(83), // USD to INR, approximate
});

export type CostEstimation = z.infer<typeof CostEstimationSchema>;

/**
 * Calculate estimated cost from tokens
 * @param estimation - Cost estimation parameters
 * @returns Estimated cost in INR and USD
 */
export function calculateCost(estimation: CostEstimation): {
  costUsd: number;
  costInr: number;
} {
  const costUsd =
    (estimation.tokensIn / 1_000_000) * estimation.modelCostPerMInput +
    (estimation.tokensOut / 1_000_000) * estimation.modelCostPerMOutput;

  const costInr = costUsd * estimation.exchangeRate;

  return {
    costUsd: Math.round(costUsd * 10000) / 10000,
    costInr: Math.round(costInr * 100) / 100,
  };
}

/**
 * Validation helper for difficulty distribution
 */
export const DifficultyDistributionSchema = z
  .object({
    easy: z.number().min(0).max(1),
    moderate: z.number().min(0).max(1),
    hard: z.number().min(0).max(1),
  })
  .refine(
    (dist) => Math.abs(dist.easy + dist.moderate + dist.hard - 1) < 0.01,
    "Difficulty distribution must sum to 1.0",
  );

export type DifficultyDistribution = z.infer<
  typeof DifficultyDistributionSchema
>;

/**
 * Validation helper for marks distribution
 */
export const MarksDistributionSchema = z
  .array(
    z.object({
      type: z.enum([
        "MCQ",
        "ShortAnswer",
        "LongAnswer",
        "TrueFalse",
        "FillInTheBlank",
      ]),
      totalMarks: z.number().int().positive(),
      percentage: z.number().min(0).max(1),
    }),
  )
  .refine((dist) => {
    const totalPercentage = dist.reduce(
      (sum, item) => sum + item.percentage,
      0,
    );
    return Math.abs(totalPercentage - 1) < 0.01;
  }, "Marks distribution percentages must sum to 1.0");

export type MarksDistribution = z.infer<typeof MarksDistributionSchema>;

export default {
  DifficultyEnum,
  QuestionTypeEnum,
  QuestionSchema,
  SectionSchema,
  QuestionPaperSchema,
  LLMResponseSchema,
  CostEstimationSchema,
  DifficultyDistributionSchema,
  MarksDistributionSchema,
  validateQuestionPaper,
  calculateCost,
};
