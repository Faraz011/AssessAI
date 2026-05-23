"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import JobStatus from "@/components/JobStatus";
import { AssignmentResponse } from "@/types";

export default function OutputPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleStatusChange = (status: AssignmentResponse) => {
    setAssignment(status);
  };

  const handleComplete = (result: AssignmentResponse) => {
    setAssignment(result);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(
        `http://localhost:4000/api/assessment/download/${jobId}`,
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-screen bg-gradient-to-b from-[#eee] to-[#dadada] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header with back button and title */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-full bg-white hover:bg-[#f6f6f6] transition-colors"
            >
              <ArrowLeft size={24} className="text-[#303030]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#303030]">
                Assignment Output
              </h1>
              <p className="text-sm text-[#5e5e5e]">Job ID: {jobId}</p>
            </div>
          </div>

          {/* Status Section - Hidden when done */}
          {!assignment?.result && (
            <div className="mb-8">
              <JobStatus
                jobId={jobId}
                onStatusChange={handleStatusChange}
                onComplete={handleComplete}
              />
            </div>
          )}

          {/* Dark Header with Success Message and Download Button */}
          {assignment?.result && (
            <div className="bg-[rgba(24,24,24,0.8)] rounded-3xl p-8 mb-8">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-white text-xl font-bold leading-relaxed">
                    Here is your customized question paper for{" "}
                    {assignment.input?.title}
                    {assignment.input?.subject
                      ? ` - ${assignment.input.subject}`
                      : ""}
                    , {assignment.input?.grade}:
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-white hover:bg-[#f6f6f6] disabled:opacity-50 disabled:cursor-not-allowed text-[#303030] font-bold px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
                  >
                    <Download size={20} />
                    {isDownloading ? "Downloading..." : "Download as PDF"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question Paper Preview Card */}
          {assignment?.result && (
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              {/* School Header */}
              <div className="text-center mb-8 pb-8 border-b-2 border-[#d4d4d4]">
                <h2 className="text-3xl font-bold text-[#303030] mb-2">
                  {assignment.result.sections?.[0]?.name
                    ? "Delhi Public School, Sector-4, Bokaro"
                    : "Question Paper"}
                </h2>
                <p className="text-lg text-[#303030] font-semibold">
                  Subject: {assignment.input?.subject || "General"}
                </p>
                <p className="text-lg text-[#303030] font-semibold">
                  Class: {assignment.input?.grade || "Not specified"}
                </p>
              </div>

              {/* Time and Marks */}
              <div className="flex justify-between mb-8 pb-8 border-b-2 border-[#d4d4d4]">
                <p className="text-lg font-semibold text-[#303030]">
                  Time Allowed: {(assignment.input?.sections?.length || 0) * 15}{" "}
                  minutes
                </p>
                <p className="text-lg font-semibold text-[#303030]">
                  Maximum Marks: {assignment.result.totalMarks}
                </p>
              </div>

              {/* Instructions */}
              <div className="mb-8 pb-8 border-b-2 border-[#d4d4d4]">
                <p className="text-lg font-semibold text-[#303030]">
                  {assignment.input?.instructions ||
                    "All questions are compulsory unless stated otherwise."}
                </p>
              </div>

              {/* Student Information */}
              <div className="mb-8 pb-8 border-b-2 border-[#d4d4d4]">
                <p className="text-lg font-semibold text-[#303030] mb-3">
                  Name: ____________________
                </p>
                <p className="text-lg font-semibold text-[#303030] mb-3">
                  Roll Number: ________________
                </p>
                <p className="text-lg font-semibold text-[#303030]">
                  Class: 5th Section: __________
                </p>
              </div>

              {/* Sections */}
              {assignment.result.sections?.map((section, sectionIdx) => (
                <div key={sectionIdx} className="mb-8">
                  {/* Section Title */}
                  <h3 className="text-2xl font-bold text-[#303030] text-center mb-6">
                    {section.name}
                  </h3>

                  {/* Section Instruction */}
                  <p className="text-lg font-semibold text-[#303030] mb-1">
                    Short Answer Questions
                  </p>
                  <p className="text-base text-[#5e5e5e] italic mb-6">
                    {section.instruction || "Attempt all questions."}
                  </p>

                  {/* Questions */}
                  <ol className="space-y-4 mb-8">
                    {section.questions?.map((question, qIdx) => (
                      <li
                        key={qIdx}
                        className="text-base text-[#303030] leading-relaxed"
                      >
                        <span className="font-semibold">
                          [{question.difficulty}]
                        </span>{" "}
                        {question.text}{" "}
                        <span className="font-semibold">
                          [{question.marks} Marks]
                        </span>
                      </li>
                    ))}
                  </ol>

                  {sectionIdx <
                    (assignment.result?.sections?.length || 0) - 1 && (
                    <div className="border-b-2 border-[#d4d4d4] mb-8" />
                  )}
                </div>
              ))}

              {/* End of Paper */}
              <div className="text-center py-8 border-t-2 border-[#d4d4d4]">
                <p className="text-lg font-semibold text-[#303030]">
                  End of Question Paper
                </p>
              </div>

              {/* Summary Stats */}
              <div className="mt-8 pt-8 border-t-2 border-[#d4d4d4]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#f6f6f6] p-4 rounded-lg">
                    <p className="text-sm text-[#5e5e5e]">Total Questions</p>
                    <p className="text-2xl font-bold text-[#303030]">
                      {assignment.result.totalQuestions}
                    </p>
                  </div>
                  <div className="bg-[#f6f6f6] p-4 rounded-lg">
                    <p className="text-sm text-[#5e5e5e]">Total Marks</p>
                    <p className="text-2xl font-bold text-[#303030]">
                      {assignment.result.totalMarks}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {!assignment?.result && (
            <div className="bg-white rounded-3xl p-16 shadow-lg text-center">
              <div className="inline-block w-12 h-12 border-4 border-[#d4d4d4] border-t-[#303030] rounded-full animate-spin mb-4" />
              <p className="text-lg text-[#303030] font-semibold">
                Generating your question paper...
              </p>
              <p className="text-sm text-[#5e5e5e] mt-2">
                This may take a few moments. Please wait.
              </p>
            </div>
          )}

          {/* Error State */}
          {assignment?.error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
              <p className="text-red-700 font-bold text-lg mb-4">
                Error generating question paper
              </p>
              <p className="text-red-600 mb-6">{assignment.error}</p>
              <button
                onClick={() => router.push("/create")}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
