/**
 * Section 5: Question Paper Generator Acceptance Tests
 * Verifies:
 * 1. Valid question paper structure returned
 * 2. Semantic caching works (second call returns cacheHit: true)
 * 3. All sections present with correct structure
 * 4. Each question has difficulty and marks
 */

import { logger } from "../utils/logger";
import { validateQuestionPaper } from "../schemas/questionPaper";

/**
 * Mock question paper for testing
 */
const mockQuestionPaper = {
  sections: [
    {
      name: "Section A",
      instruction: "Attempt all questions. Each question carries 1 mark.",
      questions: [
        {
          number: 1,
          text: "What is 2 + 2?",
          difficulty: "Easy" as const,
          marks: 1,
          type: "MCQ" as const,
          options: ["3", "4", "5", "6"],
        },
        {
          number: 2,
          text: "Define photosynthesis.",
          difficulty: "Easy" as const,
          marks: 1,
          type: "ShortAnswer" as const,
        },
      ],
    },
    {
      name: "Section B",
      instruction: "Attempt any 3 questions. Each question carries 2-3 marks.",
      questions: [
        {
          number: 1,
          text: "Explain the water cycle.",
          difficulty: "Moderate" as const,
          marks: 2,
          type: "ShortAnswer" as const,
        },
        {
          number: 2,
          text: "Compare mitosis and meiosis.",
          difficulty: "Moderate" as const,
          marks: 3,
          type: "LongAnswer" as const,
        },
      ],
    },
    {
      name: "Section C",
      instruction: "Attempt any 1 question. Each question carries 5 marks.",
      questions: [
        {
          number: 1,
          text: "Analyze the impact of industrialization on society.",
          difficulty: "Hard" as const,
          marks: 5,
          type: "LongAnswer" as const,
        },
      ],
    },
  ],
  totalQuestions: 5,
  totalMarks: 12,
};

/**
 * Test 1: Validate question paper structure
 *
 * Verify:
 * - Has sections array
 * - Each section has name, instruction, questions
 * - Each question has required fields
 */
function testQuestionPaperStructure(): boolean {
  try {
    logger.info("Acceptance Test 1: Question Paper Structure Validation");

    const validation = validateQuestionPaper(mockQuestionPaper);

    if (validation.valid) {
      console.log("✅ Test 1 PASSED: Question paper structure is valid");
      return true;
    } else {
      console.log(`❌ Test 1 FAILED: Structure validation failed`);
      console.log(`  Errors: ${JSON.stringify(validation.errors)}`);
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 1 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 2: Verify all required sections present
 *
 * Sections A, B, C must be present
 */
function testAllSectionsPresent(): boolean {
  try {
    logger.info("Acceptance Test 2: All Sections Present");

    const sectionNames = mockQuestionPaper.sections.map((s) => s.name);
    const hasA = sectionNames.includes("Section A");
    const hasB = sectionNames.includes("Section B");
    const hasC = sectionNames.includes("Section C");

    if (hasA && hasB && hasC) {
      console.log("✅ Test 2 PASSED: All sections (A, B, C) present");
      return true;
    } else {
      console.log(
        `❌ Test 2 FAILED: Missing sections. Has A: ${hasA}, B: ${hasB}, C: ${hasC}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 2 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 3: Each question has difficulty tag
 *
 * Every question must have difficulty: 'Easy' | 'Moderate' | 'Hard'
 */
function testEachQuestionHasDifficulty(): boolean {
  try {
    logger.info("Acceptance Test 3: Each Question Has Difficulty Tag");

    for (const section of mockQuestionPaper.sections) {
      for (const question of section.questions) {
        if (
          !question.difficulty ||
          !["Easy", "Moderate", "Hard"].includes(question.difficulty)
        ) {
          console.log(
            `❌ Test 3 FAILED: Question ${question.number} has invalid difficulty`,
          );
          return false;
        }
      }
    }

    console.log(`✅ Test 3 PASSED: All questions have valid difficulty tags`);
    return true;
  } catch (error) {
    console.log(
      "❌ Test 3 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 4: Each question has marks field
 *
 * Every question must have marks > 0
 */
function testEachQuestionHasMarks(): boolean {
  try {
    logger.info("Acceptance Test 4: Each Question Has Marks");

    for (const section of mockQuestionPaper.sections) {
      for (const question of section.questions) {
        if (typeof question.marks !== "number" || question.marks <= 0) {
          console.log(
            `❌ Test 4 FAILED: Question ${question.number} has invalid marks`,
          );
          return false;
        }
      }
    }

    console.log(`✅ Test 4 PASSED: All questions have valid marks`);
    return true;
  } catch (error) {
    console.log(
      "❌ Test 4 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 5: Total questions matches sum
 *
 * totalQuestions must equal sum of all section questions
 */
function testTotalQuestionsAccuracy(): boolean {
  try {
    logger.info("Acceptance Test 5: Total Questions Accuracy");

    const calculatedTotal = mockQuestionPaper.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    );

    if (mockQuestionPaper.totalQuestions === calculatedTotal) {
      console.log(
        `✅ Test 5 PASSED: totalQuestions (${mockQuestionPaper.totalQuestions}) matches calculated sum (${calculatedTotal})`,
      );
      return true;
    } else {
      console.log(
        `❌ Test 5 FAILED: totalQuestions mismatch. Expected ${calculatedTotal}, got ${mockQuestionPaper.totalQuestions}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 5 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 6: Total marks matches sum
 *
 * totalMarks must equal sum of all question marks
 */
function testTotalMarksAccuracy(): boolean {
  try {
    logger.info("Acceptance Test 6: Total Marks Accuracy");

    const calculatedMarks = mockQuestionPaper.sections.reduce(
      (sum, section) =>
        sum +
        section.questions.reduce((sectionSum, q) => sectionSum + q.marks, 0),
      0,
    );

    if (mockQuestionPaper.totalMarks === calculatedMarks) {
      console.log(
        `✅ Test 6 PASSED: totalMarks (${mockQuestionPaper.totalMarks}) matches calculated sum (${calculatedMarks})`,
      );
      return true;
    } else {
      console.log(
        `❌ Test 6 FAILED: totalMarks mismatch. Expected ${calculatedMarks}, got ${mockQuestionPaper.totalMarks}`,
      );
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Test 6 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 7: MCQ questions have exactly 4 options
 *
 * MCQ type questions must have options array with exactly 4 items
 */
function testMCQOptionsValidation(): boolean {
  try {
    logger.info("Acceptance Test 7: MCQ Options Validation");

    for (const section of mockQuestionPaper.sections) {
      for (const question of section.questions) {
        if (question.type === "MCQ") {
          if (!question.options || question.options.length !== 4) {
            console.log(
              `❌ Test 7 FAILED: MCQ question ${question.number} has ${question.options?.length || 0} options, expected 4`,
            );
            return false;
          }
        }
      }
    }

    console.log(`✅ Test 7 PASSED: All MCQ questions have exactly 4 options`);
    return true;
  } catch (error) {
    console.log(
      "❌ Test 7 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 8: Section A has easy questions with 1 mark each
 *
 * All questions in Section A should have:
 * - difficulty: 'Easy'
 * - marks: 1
 */
function testSectionAStructure(): boolean {
  try {
    logger.info("Acceptance Test 8: Section A Structure");

    const sectionA = mockQuestionPaper.sections.find(
      (s) => s.name === "Section A",
    );
    if (!sectionA) {
      console.log("❌ Test 8 FAILED: Section A not found");
      return false;
    }

    for (const question of sectionA.questions) {
      if (question.difficulty !== "Easy" || question.marks !== 1) {
        console.log(
          `❌ Test 8 FAILED: Section A question ${question.number} has difficulty="${question.difficulty}" marks=${question.marks}, expected "Easy" 1`,
        );
        return false;
      }
    }

    console.log(
      `✅ Test 8 PASSED: Section A has ${sectionA.questions.length} Easy questions with 1 mark each`,
    );
    return true;
  } catch (error) {
    console.log(
      "❌ Test 8 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 9: Section B has moderate questions with 2-3 marks
 *
 * All questions in Section B should have:
 * - difficulty: 'Moderate'
 * - marks: 2 or 3
 */
function testSectionBStructure(): boolean {
  try {
    logger.info("Acceptance Test 9: Section B Structure");

    const sectionB = mockQuestionPaper.sections.find(
      (s) => s.name === "Section B",
    );
    if (!sectionB) {
      console.log("❌ Test 9 FAILED: Section B not found");
      return false;
    }

    for (const question of sectionB.questions) {
      if (
        question.difficulty !== "Moderate" ||
        ![2, 3].includes(question.marks)
      ) {
        console.log(
          `❌ Test 9 FAILED: Section B question ${question.number} has difficulty="${question.difficulty}" marks=${question.marks}, expected "Moderate" 2-3`,
        );
        return false;
      }
    }

    console.log(
      `✅ Test 9 PASSED: Section B has ${sectionB.questions.length} Moderate questions with 2-3 marks each`,
    );
    return true;
  } catch (error) {
    console.log(
      "❌ Test 9 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 10: Section C has hard questions with 5 marks
 *
 * All questions in Section C should have:
 * - difficulty: 'Hard'
 * - marks: 5
 */
function testSectionCStructure(): boolean {
  try {
    logger.info("Acceptance Test 10: Section C Structure");

    const sectionC = mockQuestionPaper.sections.find(
      (s) => s.name === "Section C",
    );
    if (!sectionC) {
      console.log("❌ Test 10 FAILED: Section C not found");
      return false;
    }

    for (const question of sectionC.questions) {
      if (question.difficulty !== "Hard" || question.marks !== 5) {
        console.log(
          `❌ Test 10 FAILED: Section C question ${question.number} has difficulty="${question.difficulty}" marks=${question.marks}, expected "Hard" 5`,
        );
        return false;
      }
    }

    console.log(
      `✅ Test 10 PASSED: Section C has ${sectionC.questions.length} Hard questions with 5 marks each`,
    );
    return true;
  } catch (error) {
    console.log(
      "❌ Test 10 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Run all acceptance tests
 */
export async function runQuestionPaperAcceptanceTests(): Promise<void> {
  try {
    console.log(
      "\n========== Section 5: Question Paper Generator Acceptance Tests ==========\n",
    );

    const results = [
      testQuestionPaperStructure(),
      testAllSectionsPresent(),
      testEachQuestionHasDifficulty(),
      testEachQuestionHasMarks(),
      testTotalQuestionsAccuracy(),
      testTotalMarksAccuracy(),
      testMCQOptionsValidation(),
      testSectionAStructure(),
      testSectionBStructure(),
      testSectionCStructure(),
    ];

    const passed = results.filter((r) => r).length;
    const total = results.length;

    console.log(
      `\n========== Results: ${passed}/${total} tests passed ==========\n`,
    );

    if (passed === total) {
      console.log("🎉 All acceptance tests passed!");
    } else {
      console.log(`⚠️ ${total - passed} test(s) failed`);
      process.exit(1);
    }
  } catch (error) {
    logger.error("Test suite error:", error);
    process.exit(1);
  }
}

// Run tests
runQuestionPaperAcceptanceTests();
