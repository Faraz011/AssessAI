/**
 * PDF Generation Service
 * Converts question papers to professional PDF format using pdf-lib
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "../utils/logger";

interface QuestionPaperPDF {
  sections: Array<{
    name: string;
    instruction: string;
    questions: Array<{
      number: number;
      text: string;
      difficulty: "Easy" | "Moderate" | "Hard";
      marks: number;
      type:
        | "MCQ"
        | "ShortAnswer"
        | "LongAnswer"
        | "TrueFalse"
        | "FillInTheBlank";
      options?: string[];
    }>;
  }>;
  totalQuestions: number;
  totalMarks: number;
}

interface PDFMetadata {
  jobId: string;
  title: string;
  subject?: string;
  grade: string;
  schoolName?: string;
  date?: Date;
}

interface GeneratePDFResult {
  filePath: string;
  fileName: string;
}

/**
 * Generate professional PDF for question paper
 *
 * Layout:
 * 1. Header: School name, title, subject, grade, date
 * 2. Student info: Name, Roll Number, Section (input lines)
 * 3. Instructions section
 * 4. Question sections (A, B, C) with proper formatting
 * 5. Footer: Page numbers, total marks
 */
export async function generatePDF(
  questionPaper: QuestionPaperPDF,
  metadata: PDFMetadata,
): Promise<GeneratePDFResult> {
  try {
    logger.info("Starting PDF generation", {
      jobId: metadata.jobId,
      title: metadata.title,
    });

    // Create PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed standard fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold,
    );

    const margin = 40;
    const pageWidth = 612; // Letter size width
    const pageHeight = 792; // Letter size height
    const contentWidth = pageWidth - 2 * margin;

    // Create first page
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Helper function to add text
    const addText = (
      text: string,
      size: number,
      centered = false,
      spaceBefore = 5,
      spaceAfter = 5,
      bold = false,
    ) => {
      if (yPosition < margin + 20) {
        // Need new page
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      yPosition -= spaceBefore;
      const font = bold ? helveticaBoldFont : helveticaFont;
      const textWidth = font.widthOfTextAtSize(text, size);
      const x = centered ? (pageWidth - textWidth) / 2 : margin;

      currentPage.drawText(text, {
        x,
        y: yPosition,
        size,
        font,
        color: rgb(0, 0, 0),
      });

      yPosition -= size + 2 + spaceAfter;
    };

    // Header Section
    const schoolName = metadata.schoolName || "VEDAAI Assessment System";
    addText(schoolName, 14, true, 10, 10, true);

    addText(
      `${metadata.title}${metadata.subject ? ` (${metadata.subject})` : ""}`,
      18,
      true,
      5,
      8,
      true,
    );

    addText(`Grade: ${metadata.grade}`, 11, true, 2, 2, false);
    const dateStr = metadata.date
      ? metadata.date.toLocaleDateString()
      : new Date().toLocaleDateString();
    addText(`Date: ${dateStr}`, 11, true, 2, 15, false);

    // Student Info Section
    addText("Student Information", 12, false, 10, 8, true);

    currentPage.drawRectangle({
      x: margin,
      y: yPosition - 60,
      width: contentWidth,
      height: 60,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    yPosition -= 12;
    addText(
      "Name: _________________________________     Roll No.: __________",
      11,
      false,
      3,
      3,
    );
    addText(
      "Section: __________     Date of Exam: __________",
      11,
      false,
      3,
      12,
    );

    // Instructions Section
    addText("Instructions:", 12, false, 12, 5, true);
    const instructions = [
      "• All questions are compulsory.",
      "• Write answers in the space provided.",
      "• Use ballpoint pen only.",
      `• Total marks: ${questionPaper.totalMarks}`,
    ];

    for (const instr of instructions) {
      addText(instr, 11, false, 2, 2);
    }

    yPosition -= 10;

    // Question Sections
    for (const section of questionPaper.sections) {
      // Section header
      if (yPosition < margin + 100) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      // Draw section header background
      const headerY = yPosition - 20;
      currentPage.drawRectangle({
        x: margin,
        y: headerY,
        width: contentWidth,
        height: 20,
        color: rgb(0.85, 0.85, 0.85), // Light gray background
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Section name and total marks
      const sectionMarks = section.questions.reduce(
        (sum, q) => sum + q.marks,
        0,
      );
      currentPage.drawText(`${section.name} (Total Marks: ${sectionMarks})`, {
        x: margin + 5,
        y: headerY + 5,
        size: 12,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });

      yPosition = headerY - 10;

      // Section instruction
      addText(section.instruction, 10, false, 5, 8, false);

      // Questions in section
      for (const question of section.questions) {
        if (yPosition < margin + 50) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        // Question number, text and marks
        const questionHeader = `${question.number}. ${question.text} [${question.marks} marks]`;
        addText(questionHeader, 11, false, 5, 3);

        // MCQ options
        if (question.type === "MCQ" && question.options) {
          const optionLetters = ["A", "B", "C", "D"];
          for (let i = 0; i < question.options.length; i++) {
            const optionText = `${optionLetters[i]}. ${question.options[i]}`;
            addText(optionText, 10, false, 2, 2);
          }
          yPosition -= 3;
        }

        // Answer space
        if (
          question.type === "ShortAnswer" ||
          question.type === "FillInTheBlank"
        ) {
          // Draw 2 lines for short answer
          for (let i = 0; i < 2; i++) {
            currentPage.drawLine({
              start: { x: margin, y: yPosition },
              end: { x: margin + contentWidth, y: yPosition },
              thickness: 0.5,
              color: rgb(0.7, 0.7, 0.7),
            });
            yPosition -= 15;
          }
        } else if (question.type === "LongAnswer") {
          // Draw 4 lines for long answer
          for (let i = 0; i < 4; i++) {
            currentPage.drawLine({
              start: { x: margin, y: yPosition },
              end: { x: margin + contentWidth, y: yPosition },
              thickness: 0.5,
              color: rgb(0.7, 0.7, 0.7),
            });
            yPosition -= 15;
          }
        } else if (question.type === "TrueFalse") {
          addText("☐ True          ☐ False", 10, false, 2, 8);
        }

        yPosition -= 5;
      }

      yPosition -= 10;
    }

    // Footer with page numbers and total marks
    const pageCount = pdfDoc.getPages().length;
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPages()[i];
      const pageNumberText = `Page ${i + 1} of ${pageCount}`;
      const footerX =
        pageWidth / 2 - helveticaFont.widthOfTextAtSize(pageNumberText, 10) / 2;
      page.drawText(pageNumberText, {
        x: footerX,
        y: 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Total marks in footer of first page only
      if (i === 0) {
        page.drawText(`Total Marks: ${questionPaper.totalMarks}`, {
          x: margin,
          y: 20,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    // Save PDF
    const tmpDir = "/tmp";
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }

    const fileName = `vedaai-${metadata.jobId}-${Date.now()}.pdf`;
    const filePath = join(tmpDir, fileName);

    const pdfBytes = await pdfDoc.save();
    writeFileSync(filePath, pdfBytes);

    logger.info("PDF generated successfully", {
      jobId: metadata.jobId,
      filePath,
      fileName,
    });

    return { filePath, fileName };
  } catch (error) {
    logger.error("PDF generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
