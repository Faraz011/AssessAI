/**
 * Section 2 Acceptance Criteria Tests
 * Validates the Zod contract for LLM output
 */

import { QuestionPaperSchema } from "./schemas/questionPaper";
import { CreateAssignmentRequestSchema } from "./schemas/request";

/**
 * Test 1: Valid paper parses successfully
 */
function testValidPaperParsing() {
  const validPaper = {
    sections: [
      {
        name: "Section A",
        instruction: "Answer all questions",
        questions: [
          {
            number: 1,
            text: "What is the capital of France?",
            type: "MCQ",
            options: ["Paris", "London", "Berlin", "Madrid"],
            difficulty: "Easy",
            marks: 2,
          },
          {
            number: 2,
            text: "Explain photosynthesis in detail",
            type: "LongAnswer",
            difficulty: "Hard",
            marks: 5,
          },
        ],
      },
    ],
    totalQuestions: 2,
    totalMarks: 7,
  };

  try {
    QuestionPaperSchema.parse(validPaper);
    console.log("✅ Test 1 PASSED: Valid paper parsed successfully");
    return true;
  } catch (error) {
    console.log(
      "❌ Test 1 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 2: Invalid totalMarks throws clear mismatch error
 */
function testTotalMarksMismatch() {
  const invalidPaper = {
    sections: [
      {
        name: "Section A",
        instruction: "Answer all questions",
        questions: [
          {
            number: 1,
            text: "What is the capital of France?",
            type: "MCQ",
            options: ["Paris", "London", "Berlin", "Madrid"],
            difficulty: "Easy",
            marks: 2,
          },
        ],
      },
    ],
    totalQuestions: 1,
    totalMarks: 999, // Mismatch!
  };

  try {
    QuestionPaperSchema.parse(invalidPaper);
    console.log(
      "❌ Test 2 FAILED: Should have thrown error for marks mismatch",
    );
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("totalMarks mismatch") || message.includes("actual")) {
      console.log(
        "✅ Test 2 PASSED: Marks mismatch error caught with clear message",
      );
      return true;
    } else {
      console.log("❌ Test 2 FAILED: Error not clear enough:", message);
      return false;
    }
  }
}

/**
 * Test 3: MCQ with 3 options throws
 */
function testMCQWith3Options() {
  const invalidMCQ = {
    sections: [
      {
        name: "Section A",
        instruction: "Answer all questions",
        questions: [
          {
            number: 1,
            text: "What is the capital of France?",
            type: "MCQ",
            options: ["Paris", "London", "Berlin"], // Only 3 options!
            difficulty: "Easy",
            marks: 2,
          },
        ],
      },
    ],
    totalQuestions: 1,
    totalMarks: 2,
  };

  try {
    QuestionPaperSchema.parse(invalidMCQ);
    console.log(
      "❌ Test 3 FAILED: Should have thrown error for MCQ with 3 options",
    );
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("MCQ") ||
      message.includes("4 options") ||
      message.includes("exactly")
    ) {
      console.log("✅ Test 3 PASSED: MCQ validation error caught");
      return true;
    } else {
      console.log("❌ Test 3 FAILED: Error not clear enough:", message);
      return false;
    }
  }
}

/**
 * Test 4: Request with count: -2 is rejected
 */
function testNegativeCountRejection() {
  const invalidRequest = {
    title: "Math Test",
    grade: "Grade 10",
    questionTypes: ["MCQ"],
    sections: [
      {
        name: "Algebra",
        count: -2, // Invalid!
        marksPerQ: 2,
        difficulty: "Easy",
        type: "MCQ",
      },
    ],
  };

  try {
    CreateAssignmentRequestSchema.parse(invalidRequest);
    console.log("❌ Test 4 FAILED: Should have rejected negative count");
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("count") || message.includes("must be")) {
      console.log("✅ Test 4 PASSED: Negative count rejected at route level");
      return true;
    } else {
      console.log("❌ Test 4 FAILED: Error not clear enough:", message);
      return false;
    }
  }
}

/**
 * Test 5: Question numbering validation (1..N, no gaps)
 */
function testQuestionNumberingValidation() {
  const invalidNumbering = {
    sections: [
      {
        name: "Section A",
        instruction: "Answer all questions",
        questions: [
          {
            number: 1,
            text: "First question",
            type: "MCQ",
            options: ["A", "B", "C", "D"],
            difficulty: "Easy",
            marks: 2,
          },
          {
            number: 3, // Gap! Should be 2
            text: "Second question",
            type: "MCQ",
            options: ["A", "B", "C", "D"],
            difficulty: "Easy",
            marks: 2,
          },
        ],
      },
    ],
    totalQuestions: 2,
    totalMarks: 4,
  };

  try {
    QuestionPaperSchema.parse(invalidNumbering);
    console.log(
      "❌ Test 5 FAILED: Should have rejected question numbering gap",
    );
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("numbered") || message.includes("gap")) {
      console.log("✅ Test 5 PASSED: Question numbering gap detected");
      return true;
    } else {
      console.log("❌ Test 5 FAILED: Error not clear enough:", message);
      return false;
    }
  }
}

/**
 * Run all tests
 */
export function runAcceptanceCriteriaTests() {
  console.log("\n========== Section 2: Zod Contract Tests ==========\n");

  const results = [
    testValidPaperParsing(),
    testTotalMarksMismatch(),
    testMCQWith3Options(),
    testNegativeCountRejection(),
    testQuestionNumberingValidation(),
  ];

  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log(
    `\n========== Results: ${passed}/${total} tests passed ==========\n`,
  );

  if (passed === total) {
    console.log("🎉 All acceptance criteria met!");
  } else {
    console.log(`⚠️ ${total - passed} test(s) failed`);
    process.exit(1);
  }
}

// Uncomment to run tests
runAcceptanceCriteriaTests();
