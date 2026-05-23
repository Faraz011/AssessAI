"use client";

import { useState } from "react";
import { Download, RotateCcw, Printer } from "lucide-react";
import StudentInfoSection from "./StudentInfoSection";
import { QuestionPaper, StudentInfo, Difficulty } from "@/types";

interface QuestionPaperProps {
  data: QuestionPaper;
  title: string;
  subject?: string;
  grade: string;
  onRegenerate?: () => void;
  onDownload?: () => void;
  jobId: string;
}

const getDifficultyColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "Easy":
      return "bg-green-100 text-green-800";
    case "Moderate":
      return "bg-yellow-100 text-yellow-800";
    case "Hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function QuestionPaperComponent({
  data,
  title,
  subject,
  grade,
  onRegenerate,
  onDownload,
  jobId,
}: QuestionPaperProps) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: "",
    rollNumber: "",
    section: "",
    date: new Date().toLocaleDateString(),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Print-friendly wrapper */}
        <div className="print:shadow-none">
          {/* Header - Hidden in Print */}
          <div className="print:hidden mb-8 space-y-4">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
                >
                  <RotateCcw className="w-5 h-5" />
                  Regenerate
                </button>
              )}
            </div>
          </div>

          {/* Printable Content */}
          <div className="bg-white p-8 print:p-0">
            {/* Student Info Section */}
            <StudentInfoSection
              initialInfo={studentInfo}
              onInfoChange={setStudentInfo}
            />

            {/* Question Paper Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {subject && (
                <p className="text-lg text-gray-600 mb-1">Subject: {subject}</p>
              )}
              <p className="text-gray-600">
                {grade} | Total Questions: {data.totalQuestions} | Total Marks:{" "}
                {data.totalMarks}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {data.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="page-break">
                  {/* Section Header */}
                  <div className="mb-6 pb-4 border-b-2 border-purple-300">
                    <h2 className="text-xl font-bold text-purple-600">
                      {section.name}
                    </h2>
                    {section.instruction && (
                      <p className="text-gray-700 italic mt-2">
                        {section.instruction}
                      </p>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    {section.questions.map((question, qIndex) => (
                      <div key={qIndex} className="mb-6">
                        {/* Question Number and Text */}
                        <div className="flex gap-3">
                          <div className="min-w-fit">
                            <span className="inline-block w-6 h-6 bg-purple-600 text-white text-center text-sm font-bold rounded">
                              {question.number}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <p className="text-gray-900 leading-relaxed flex-1">
                                {question.text}
                              </p>
                              <div className="flex gap-2 items-center">
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded ${getDifficultyColor(
                                    question.difficulty,
                                  )}`}
                                >
                                  {question.difficulty}
                                </span>
                                <span className="text-sm font-bold text-gray-600 whitespace-nowrap">
                                  [{question.marks}]
                                </span>
                              </div>
                            </div>

                            {/* MCQ Options */}
                            {question.type === "MCQ" && question.options && (
                              <div className="mt-3 ml-4 space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex gap-3">
                                    <span className="text-gray-600 font-medium">
                                      {String.fromCharCode(65 + oIndex)}.
                                    </span>
                                    <span className="text-gray-700">
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Answer Space for Short/Long Answer */}
                            {(question.type === "ShortAnswer" ||
                              question.type === "LongAnswer") && (
                              <div className="mt-4 ml-4">
                                {question.type === "ShortAnswer" ? (
                                  <div className="space-y-1">
                                    <div className="border-b border-gray-300 h-6" />
                                    <div className="border-b border-gray-300 h-6" />
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="border-b border-gray-300 h-6" />
                                    <div className="border-b border-gray-300 h-6" />
                                    <div className="border-b border-gray-300 h-6" />
                                    <div className="border-b border-gray-300 h-6" />
                                    <div className="border-b border-gray-300 h-6" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* True/False Options */}
                            {question.type === "TrueFalse" && (
                              <div className="mt-3 ml-4 space-y-2 flex gap-8">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    disabled
                                  />
                                  <span>True</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    disabled
                                  />
                                  <span>False</span>
                                </label>
                              </div>
                            )}

                            {/* Fill in the Blank */}
                            {question.type === "FillInTheBlank" && (
                              <div className="mt-3 ml-4">
                                <div className="inline-block border-b-2 border-gray-400 w-32" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
              <p>Generated by VedaAI Assessment Generator</p>
              <p className="text-xs mt-1">Job ID: {jobId}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            background: white;
          }
          .print\:hidden {
            display: none !important;
          }
          .page-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
