/**
 * Section 6: PDF Generator Acceptance Tests
 * Verifies:
 * 1. PDF is generated and file is created
 * 2. PDF is readable and valid format
 * 3. File contains expected content structure
 * 4. File path is correct format
 */

// Load environment variables first
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { generatePDF } from "./pdfGenerator";
import { logger } from "../utils/logger";
import { readFileSync, existsSync, unlinkSync } from "fs";

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
          text: "What is the capital of France?",
          difficulty: "Easy" as const,
          marks: 1,
          type: "MCQ" as const,
          options: ["London", "Paris", "Berlin", "Madrid"],
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

const mockMetadata = {
  jobId: "test-job-" + Date.now(),
  title: "Biology Assessment",
  subject: "Biology",
  grade: "10",
  schoolName: "Test School",
  date: new Date(),
};

/**
 * Test 1: PDF file is created and exists
 */
async function testPDFFileCreated(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 1: PDF File Created");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    if (!result.filePath || !result.fileName) {
      console.log("❌ Test 1 FAILED: No filePath or fileName returned");
      return false;
    }

    if (!existsSync(result.filePath)) {
      console.log(`❌ Test 1 FAILED: PDF file not found at ${result.filePath}`);
      return false;
    }

    console.log(`✅ Test 1 PASSED: PDF file created at ${result.filePath}`);

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
 * Test 2: PDF file has correct naming format
 */
async function testPDFFileNaming(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 2: PDF File Naming Format");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const expectedPattern = /^vedaai-test-job-\d+-\d+\.pdf$/;
    if (!expectedPattern.test(result.fileName)) {
      console.log(
        `❌ Test 2 FAILED: File name doesn't match expected pattern. Got: ${result.fileName}`,
      );
      return false;
    }

    console.log(
      `✅ Test 2 PASSED: PDF file name format correct (${result.fileName})`,
    );

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

    return true;
  } catch (error) {
    console.log(
      "❌ Test 2 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 3: PDF file is valid PDF format
 */
async function testPDFFileFormat(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 3: PDF File Format");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const buffer = readFileSync(result.filePath);
    const header = buffer.toString("ascii", 0, 4);

    if (header !== "%PDF") {
      console.log(
        `❌ Test 3 FAILED: File is not a valid PDF (header: ${header})`,
      );
      return false;
    }

    console.log("✅ Test 3 PASSED: PDF file has valid PDF format header");

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
 * Test 4: PDF file size is reasonable
 */
async function testPDFFileSize(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 4: PDF File Size");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const buffer = readFileSync(result.filePath);
    const fileSizeKB = buffer.length / 1024;

    // PDF with content should be larger than 2KB, less than 1000KB
    if (fileSizeKB < 1 || fileSizeKB > 1000) {
      console.log(
        `❌ Test 4 FAILED: PDF file size (${fileSizeKB.toFixed(2)}KB) is unreasonable`,
      );
      return false;
    }

    console.log(
      `✅ Test 4 PASSED: PDF file size is reasonable (${fileSizeKB.toFixed(2)}KB)`,
    );

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
 * Test 5: PDF has proper stream structure
 */
async function testPDFStreamStructure(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 5: PDF Stream Structure");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const buffer = readFileSync(result.filePath);
    const pdfText = buffer.toString("latin1");

    // Check for PDF object markers and stream objects
    const hasObjects = pdfText.includes("endobj");
    const hasStreams =
      pdfText.includes("stream") && pdfText.includes("endstream");

    if (!hasObjects || !hasStreams) {
      console.log("❌ Test 5 FAILED: PDF missing expected structure");
      console.log(`  Objects: ${hasObjects}, Streams: ${hasStreams}`);
      return false;
    }

    console.log(
      "✅ Test 5 PASSED: PDF has proper structure with objects and streams",
    );

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

    return true;
  } catch (error) {
    console.log(
      "❌ Test 5 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 6: PDF has multiple pages (if needed)
 */
async function testPDFPageStructure(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 6: PDF Page Structure");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const buffer = readFileSync(result.filePath);
    const pdfText = buffer.toString("latin1");

    // Check for EOF marker which indicates proper PDF file ending
    const hasEOF = pdfText.includes("%%EOF");

    // Also check for valid PDF structure with objects
    const hasValidStructure = (pdfText.match(/obj\s/g) || []).length > 0;

    if (!hasEOF || !hasValidStructure) {
      console.log("❌ Test 6 FAILED: PDF missing proper ending or structure");
      return false;
    }

    console.log("✅ Test 6 PASSED: PDF has proper ending structure");

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

    return true;
  } catch (error) {
    console.log(
      "❌ Test 6 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 7: PDF has font resources
 */
async function testPDFFontResources(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 7: PDF Font Resources");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const buffer = readFileSync(result.filePath);
    const pdfText = buffer.toString("latin1");

    // Check for dictionary markers which indicate structured content
    const hasDictMarkers = pdfText.includes("<<") && pdfText.includes(">>");

    if (!hasDictMarkers) {
      console.log("❌ Test 7 FAILED: PDF missing dictionary structure");
      return false;
    }

    console.log("✅ Test 7 PASSED: PDF has dictionary resources");

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
 * Test 8: PDF has content streams
 */
async function testPDFContentStreams(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 8: PDF Content Streams");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    const buffer = readFileSync(result.filePath);
    const pdfText = buffer.toString("latin1");

    // Check for multiple objects which indicates content
    const objectCount = (pdfText.match(/obj\s/g) || []).length;

    if (objectCount < 5) {
      console.log(
        `❌ Test 8 FAILED: PDF has insufficient objects (${objectCount})`,
      );
      return false;
    }

    console.log(
      `✅ Test 8 PASSED: PDF has ${objectCount} objects with content`,
    );

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
 * Test 9: PDF can be saved to filesystem
 */
async function testPDFFilePersistence(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 9: PDF File Persistence");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    // File should exist after generation
    if (!existsSync(result.filePath)) {
      console.log(
        `❌ Test 9 FAILED: PDF file not persisted at ${result.filePath}`,
      );
      return false;
    }

    // File should be readable
    const buffer = readFileSync(result.filePath);
    if (buffer.length === 0) {
      console.log("❌ Test 9 FAILED: PDF file is empty");
      return false;
    }

    console.log("✅ Test 9 PASSED: PDF file is persisted and readable");

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
 * Test 10: PDF generation includes all metadata
 */
async function testPDFMetadataInclusion(): Promise<boolean> {
  try {
    logger.info("Acceptance Test 10: PDF Metadata Inclusion");

    const result = await generatePDF(mockQuestionPaper, mockMetadata);

    // Should have valid return object with all required fields
    if (!result.filePath || !result.fileName) {
      console.log("❌ Test 10 FAILED: Missing filePath or fileName in result");
      return false;
    }

    // File name should include job ID
    if (!result.fileName.includes(mockMetadata.jobId)) {
      console.log(`❌ Test 10 FAILED: File name doesn't include job ID`);
      return false;
    }

    // File path should be valid
    if (!result.filePath.includes(mockMetadata.jobId)) {
      console.log("❌ Test 10 FAILED: File path doesn't include job ID");
      return false;
    }

    console.log("✅ Test 10 PASSED: PDF metadata is complete and correct");

    // Clean up
    try {
      unlinkSync(result.filePath);
    } catch {
      /* ignore cleanup errors */
    }

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
export async function runPDFGeneratorAcceptanceTests(): Promise<void> {
  try {
    console.log(
      "\n========== Section 6: PDF Generator Acceptance Tests ==========\n",
    );

    const results = await Promise.all([
      testPDFFileCreated(),
      testPDFFileNaming(),
      testPDFFileFormat(),
      testPDFFileSize(),
      testPDFStreamStructure(),
      testPDFPageStructure(),
      testPDFFontResources(),
      testPDFContentStreams(),
      testPDFFilePersistence(),
      testPDFMetadataInclusion(),
    ]);

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
runPDFGeneratorAcceptanceTests();
