/**
 * File Parser Service
 * Handles parsing of uploaded files (PDF, TXT, DOCX)
 * Extracts text content and provides metadata
 */

import { readFileSync } from "fs";
import { logger } from "../utils/logger";
// @ts-ignore - pdf-parse doesn't have type definitions
import pdfParse from "pdf-parse";

/**
 * Result from file parsing operation
 */
export interface ParseResult {
  content: string;
  wordCount: number;
  error?: string;
  success: boolean;
}

/**
 * Supported file types for parsing
 */
type FileType = "pdf" | "txt" | "docx";

/**
 * Count words in text by splitting on whitespace
 * @param text The text to count words in
 * @returns Number of words
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  // Split on whitespace and filter empty strings
  const words = text.trim().split(/\s+/);
  return words.length;
}

/**
 * Clean extracted text by removing extra whitespace and normalizing
 * @param text Raw extracted text
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  if (!text) {
    return "";
  }

  // Remove multiple consecutive newlines, replace with single newline
  let cleaned = text.replace(/\n\s*\n/g, "\n");

  // Remove multiple consecutive spaces
  cleaned = cleaned.replace(/  +/g, " ");

  // Trim leading and trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Parse PDF file and extract text content
 * @param filePath Path to the PDF file
 * @returns Parsed text content
 */
async function parsePDF(filePath: string): Promise<string> {
  try {
    logger.info("Parsing PDF file", { filePath });

    // Read PDF file as buffer
    const fileBuffer = readFileSync(filePath);

    // Parse PDF and extract text
    const pdfData = await pdfParse(fileBuffer);

    // Extract text from all pages
    const text = pdfData.text || "";

    logger.info("PDF parsed successfully", {
      filePath,
      pages: pdfData.numpages,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    logger.error("PDF parsing failed", {
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Parse TXT file and read content
 * @param filePath Path to the TXT file
 * @returns File content
 */
async function parseTXT(filePath: string): Promise<string> {
  try {
    logger.info("Parsing TXT file", { filePath });

    // Read file with UTF-8 encoding
    const content = readFileSync(filePath, "utf-8");

    logger.info("TXT file parsed successfully", {
      filePath,
      contentLength: content.length,
    });

    return content;
  } catch (error) {
    logger.error("TXT parsing failed", {
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Parse DOCX file and extract text content
 * Note: Basic implementation - for production, use a proper DOCX library
 * @param _filePath Path to the DOCX file
 * @returns Parsed text content
 */
async function parseDOCX(_filePath: string): Promise<string> {
  logger.warn("DOCX parsing not fully implemented");
  throw new Error(
    "DOCX parsing not yet implemented. Please use pdf-parse or docx library.",
  );
}

/**
 * Main file parser function
 * Parses uploaded files and extracts text content
 *
 * @param filePath Absolute path to the file to parse
 * @param fileType Type of file: 'pdf', 'txt', or 'docx'
 * @returns ParseResult with content, wordCount, and error information
 *
 * @example
 * const result = await parseFile('/tmp/document.pdf', 'pdf');
 * console.log(result.wordCount); // Number of words extracted
 */
export async function parseFile(
  filePath: string,
  fileType: FileType,
): Promise<ParseResult> {
  try {
    logger.info("Starting file parsing", { filePath, fileType });

    // Validate inputs
    if (!filePath || !fileType) {
      const errorMsg = "Missing required parameters: filePath and fileType";
      logger.error(errorMsg);
      return {
        content: "",
        wordCount: 0,
        error: errorMsg,
        success: false,
      };
    }

    // Normalize file type to lowercase
    const normalizedFileType = fileType.toLowerCase() as FileType;

    let rawContent = "";

    // Parse based on file type
    switch (normalizedFileType) {
      case "pdf":
        rawContent = await parsePDF(filePath);
        break;

      case "txt":
        rawContent = await parseTXT(filePath);
        break;

      case "docx":
        rawContent = await parseDOCX(filePath);
        break;

      default:
        const unsupportedMsg = `Unsupported file type: ${fileType}. Supported types: pdf, txt, docx`;
        logger.error(unsupportedMsg);
        return {
          content: "",
          wordCount: 0,
          error: unsupportedMsg,
          success: false,
        };
    }

    // Clean extracted text
    const cleanedContent = cleanText(rawContent);

    // Count words
    const wordCount = countWords(cleanedContent);

    logger.info("File parsed successfully", {
      filePath,
      fileType: normalizedFileType,
      wordCount,
      contentLength: cleanedContent.length,
    });

    return {
      content: cleanedContent,
      wordCount,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("File parsing error", {
      filePath,
      fileType,
      error: errorMessage,
    });

    return {
      content: "",
      wordCount: 0,
      error: errorMessage,
      success: false,
    };
  }
}

/**
 * Validate if a file type is supported
 * @param fileType File type to validate
 * @returns true if supported, false otherwise
 */
export function isSupportedFileType(fileType: string): fileType is FileType {
  const supportedTypes: FileType[] = ["pdf", "txt", "docx"];
  return supportedTypes.includes(fileType.toLowerCase() as FileType);
}

/**
 * Get list of supported file types
 * @returns Array of supported file types
 */
export function getSupportedFileTypes(): FileType[] {
  return ["pdf", "txt", "docx"];
}
