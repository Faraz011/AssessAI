/**
 * Question Paper Generator
 * Generates assessment papers using LLM with semantic caching and circuit breaker protection
 */

import { logger } from "../utils/logger";
import { checkCache, storeInCache, estimateCost } from "../cache/semantic";
import { routeLLMCall } from "../llm/router";
import { validateQuestionPaper } from "../schemas/questionPaper";
import type { AssignmentOutput, InputSection } from "../models/Assignment";

interface SectionCounts {
  sectionA?: number;
  sectionB?: number;
  sectionC?: number;
}

interface GenerateQuestionPaperResult {
  questionPaper: AssignmentOutput;
  modelUsed: string;
  cacheHit: boolean;
  costSaved: number;
}

interface GenerateQuestionPaperOptions {
  jobId: string;
  title: string;
  subject?: string;
  grade: string;
  sections: InputSection[];
  questionTypes: string[];
  instructions?: string;
  fileContent?: string;
}

function getSectionCounts(sections: InputSection[]): SectionCounts {
  return {
    sectionA: sections.find((section) => section.name === "Section A")?.count,
    sectionB: sections.find((section) => section.name === "Section B")?.count,
    sectionC: sections.find((section) => section.name === "Section C")?.count,
  };
}

function summarizeSections(sections: InputSection[]): string {
  return sections
    .map(
      (section) =>
        `${section.name}: ${section.count} questions, ${section.marksPerQ} marks each, ${section.difficulty} difficulty, type ${section.type}${section.instruction ? `, instruction: ${section.instruction}` : ""}`,
    )
    .join("\n");
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch?.[1]) {
      return codeBlockMatch[1].trim();
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function computePaperTotals(paper: AssignmentOutput): {
  totalQuestions: number;
  totalMarks: number;
} {
  const totalQuestions = paper.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0,
  );

  const totalMarks = paper.sections.reduce(
    (sum, section) =>
      sum +
      section.questions.reduce(
        (sectionSum, question) => sectionSum + question.marks,
        0,
      ),
    0,
  );

  return { totalQuestions, totalMarks };
}

function normalizePaper(paper: AssignmentOutput): AssignmentOutput {
  const normalizedSections = paper.sections.map((section) => ({
    ...section,
    instruction: (section.instruction || "Attempt all questions.").trim(),
    questions: section.questions.map((question) => {
      const normalizedQuestion = { ...question };

      if (normalizedQuestion.type === "MCQ") {
        const options = Array.isArray(normalizedQuestion.options)
          ? normalizedQuestion.options
              .map((option) => option.trim())
              .filter(
                (option, index, array) =>
                  option.length > 0 && array.indexOf(option) === index,
              )
              .slice(0, 4)
          : [];

        while (options.length < 4) {
          options.push(`Option ${options.length + 1}`);
        }

        normalizedQuestion.options = options;
      } else {
        delete normalizedQuestion.options;
      }

      return normalizedQuestion;
    }),
  }));

  const normalizedPaper: AssignmentOutput = {
    ...paper,
    sections: normalizedSections,
    generatedAt: paper.generatedAt ? new Date(paper.generatedAt) : new Date(),
  };

  const totals = computePaperTotals(normalizedPaper);

  return {
    ...normalizedPaper,
    totalQuestions: totals.totalQuestions,
    totalMarks: totals.totalMarks,
  };
}

function buildRepairPrompt(
  invalidJson: string,
  validationErrors: string[],
  sections: InputSection[],
  title: string,
  subject: string | undefined,
  grade: string,
  questionTypes: string[],
  instructions: string | undefined,
  fileContent: string | undefined,
): string {
  const sectionSummary = summarizeSections(sections);
  const sourceContent = fileContent?.trim()
    ? fileContent.trim().slice(0, 5000)
    : "No uploaded source document provided.";

  return `Fix the following question paper JSON so it is fully valid and realistic.

Assessment:
- Title: ${title}
- Subject: ${subject || "Not specified"}
- Grade: ${grade}
- Question types allowed: ${questionTypes.join(", ")}
- Additional instructions: ${instructions || "None"}

Section plan:
${sectionSummary}

Source material:
${sourceContent}

Validation errors to fix:
${validationErrors.map((error) => `- ${error}`).join("\n")}

Hard rules:
- Preserve real question text whenever possible.
- Every MCQ must have exactly 4 non-empty options.
- Remove options from non-MCQ questions.
- totalQuestions must equal the sum of all questions in all sections.
- totalMarks must equal the sum of every question's marks.
- Use sequential numbering starting at 1 inside each section.
- Return ONLY valid JSON and nothing else.

Invalid JSON to repair:
${invalidJson}`;
}

async function repairQuestionPaper(
  invalidJson: string,
  validationErrors: string[],
  title: string,
  subject: string | undefined,
  grade: string,
  sections: InputSection[],
  questionTypes: string[],
  instructions: string | undefined,
  fileContent: string | undefined,
  numQuestions: SectionCounts,
): Promise<AssignmentOutput> {
  const repairPrompt = buildRepairPrompt(
    invalidJson,
    validationErrors,
    sections,
    title,
    subject,
    grade,
    questionTypes,
    instructions,
    fileContent,
  );

  const repairResponse = await routeLLMCall(
    repairPrompt,
    title,
    grade,
    numQuestions,
  );
  const repairedJson = extractJsonObject(repairResponse.content);
  const repairedPaper = JSON.parse(repairedJson) as AssignmentOutput;
  const normalized = normalizePaper(repairedPaper);
  const validation = validateQuestionPaper(normalized);

  if (!validation.valid) {
    throw new Error(
      `Invalid question paper structure after repair: ${JSON.stringify(validation.errors)}`,
    );
  }

  return {
    ...validation.data,
    generatedAt: validation.data.generatedAt
      ? new Date(validation.data.generatedAt)
      : new Date(),
  };
}

/**
 * Build the prompt for question paper generation
 */
function buildQuestionPaperPrompt(
  title: string,
  subject: string | undefined,
  grade: string,
  sections: InputSection[],
  questionTypes: string[],
  instructions: string | undefined,
  fileContent: string | undefined,
): string {
  const sectionSummary = summarizeSections(sections);
  const sourceContent = fileContent?.trim()
    ? fileContent.trim().slice(0, 5000)
    : "No uploaded source document provided.";

  return `You are an expert exam paper writer.

Create a complete, realistic question paper for the assessment below.

Assessment:
- Title: ${title}
- Subject: ${subject || "Not specified"}
- Grade: ${grade}
- Question types allowed: ${questionTypes.join(", ")}
- Additional instructions: ${instructions || "None"}

Section plan:
${sectionSummary}

Source material:
${sourceContent}

Rules:
- Generate real, specific, curriculum-appropriate questions.
- Do not use placeholder text like "Question text here", "Sample question", or generic template wording.
- Use the section plan exactly: correct section names, exact question counts, exact marks per question, and matching difficulty.
- Keep numbering sequential starting at 1 within each section.
- Section instructions must be concise and specific to the section.
- MCQ questions must have exactly 4 options.
- Questions must be unique and not repetitive.
- If source material is provided, base as many questions as possible on it.
- Return ONLY valid JSON. No markdown, no explanation, no code fences.

Return JSON in this exact shape:
{
  "sections": [
    {
      "name": "Section A",
      "instruction": "Attempt all questions.",
      "questions": [
        {
          "number": 1,
          "text": "A real question sentence.",
          "type": "MCQ",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "difficulty": "Easy",
          "marks": 1
        }
      ]
    }
  ],
  "totalQuestions": 0,
  "totalMarks": 0,
  "generatedAt": "${new Date().toISOString()}"
}`;
}

/**
 * Main function: Generate question paper with caching and fallback
 *
 * Flow:
 * 1. Check semantic cache
 * 2. If MISS: classify request → route LLM call → parse JSON
 * 3. Store in cache
 * 4. Return result with cache stats
 */
export async function generateQuestionPaper(
  options: GenerateQuestionPaperOptions,
): Promise<GenerateQuestionPaperResult> {
  const {
    jobId,
    title,
    subject,
    grade,
    sections,
    questionTypes,
    instructions,
    fileContent,
  } = options;

  logger.info("Starting question paper generation", {
    jobId,
    title,
    grade,
  });

  try {
    // Step 1: Check semantic cache
    logger.debug("Checking semantic cache...");
    const numQuestions = getSectionCounts(sections);
    const totalQuestions = sections.reduce(
      (sum, section) => sum + section.count,
      0,
    );
    const cacheCheck = await checkCache({
      title,
      subject,
      grade,
      sections,
      totalQuestions,
      questionTypes,
      instructions,
      fileContent,
    });

    if (cacheCheck.hit && cacheCheck.result) {
      logger.info("Cache HIT: Skipping LLM call", {
        jobId,
        similarity: cacheCheck.similarity,
        costSaved: cacheCheck.savedCost,
      });

      return {
        questionPaper: cacheCheck.result as AssignmentOutput,
        modelUsed: "cached",
        cacheHit: true,
        costSaved: cacheCheck.savedCost || 0,
      };
    }

    logger.info("Cache MISS: Proceeding with LLM generation");

    // Step 2: Build prompt and route to LLM
    const prompt = buildQuestionPaperPrompt(
      title,
      subject,
      grade,
      sections,
      questionTypes,
      instructions,
      fileContent,
    );

    const llmResponse = await routeLLMCall(prompt, title, grade, numQuestions);
    const modelUsed = llmResponse.modelUsed;

    logger.debug("LLM call completed", {
      modelUsed,
      tokensUsed: llmResponse.tokensUsed,
    });

    // Step 3: Parse JSON response
    const jsonText = extractJsonObject(llmResponse.content);
    const parsedQuestionPaper = JSON.parse(jsonText) as AssignmentOutput;
    const normalizedQuestionPaper = normalizePaper(parsedQuestionPaper);

    // Validate structure
    const validation = validateQuestionPaper(normalizedQuestionPaper);
    const questionPaper: AssignmentOutput = validation.valid
      ? {
          ...validation.data,
          generatedAt: validation.data.generatedAt
            ? new Date(validation.data.generatedAt)
            : new Date(),
        }
      : await repairQuestionPaper(
          jsonText,
          validation.errors,
          title,
          subject,
          grade,
          sections,
          questionTypes,
          instructions,
          fileContent,
          numQuestions,
        );

    logger.info("Question paper validated successfully", {
      totalQuestions: questionPaper.totalQuestions,
      totalMarks: questionPaper.totalMarks,
    });

    // Step 4: Store in cache
    const cacheKey = await storeInCache(
      {
        title,
        subject,
        grade,
        sections,
        totalQuestions,
        questionTypes,
        instructions,
        fileContent,
      },
      questionPaper,
    );

    logger.debug("Question paper stored in cache", { cacheKey });

    // Step 5: Calculate cost saved
    const costSaved = estimateCost(numQuestions);

    logger.info("Question paper generation completed", {
      jobId,
      modelUsed,
      totalQuestions: questionPaper.totalQuestions,
      totalMarks: questionPaper.totalMarks,
    });

    return {
      questionPaper,
      modelUsed,
      cacheHit: false,
      costSaved,
    };
  } catch (error) {
    logger.error("Question paper generation failed", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
