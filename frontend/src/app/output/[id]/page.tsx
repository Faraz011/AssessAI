"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
          {assignment?.result && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left: Paper preview */}
                  <div className="md:col-span-8 bg-white">
                    {/* School Header */}
                    <div className="text-center mb-6 pb-6 border-b border-[#e6e6e6]">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] mb-1">
                        {assignment.result.sections?.[0]?.name
                          ? "Delhi Public School, Sector-4, Bokaro"
                          : "Question Paper"}
                      </h2>
                      <p className="text-base text-[#374151] font-medium">
                        Subject: {assignment.input?.subject || "General"} • Class: {assignment.input?.grade || "-"}
                      </p>
                    </div>

                    {/* Paper body */}
                    <div className="prose max-w-none text-[#111827]">
                      {assignment.result.sections?.map((section, sectionIdx) => (
                        <section key={sectionIdx} className="mb-6">
                          <h3 className="text-xl font-bold text-center mb-3">{section.name}</h3>
                          <p className="text-sm italic text-[#6b7280] text-center mb-4">{section.instruction || "Attempt all questions."}</p>
                          <ol className="list-decimal list-inside space-y-3">
                            {section.questions?.map((q, qi) => (
                              <li key={qi} className="leading-relaxed">
                                <div className="flex items-baseline justify-between gap-4">
                                  <div className="flex-1">
                                    <span className="font-semibold text-sm text-[#6b7280] mr-2">[{q.difficulty}]</span>
                                    <span>{q.text}</span>
                                  </div>
                                  <div className="ml-4 font-semibold text-sm">{q.marks}m</div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </section>
                      ))}
                    </div>
                  </div>

                  {/* Right: Sidebar with stats and PDF preview */}
                  <aside className="md:col-span-4">
                    <div className="bg-[#f8fafc] p-4 rounded-lg mb-4">
                      <p className="text-sm text-[#6b7280]">Time Allowed</p>
                      <p className="text-lg font-bold">{(assignment.input?.sections?.length || 0) * 15} minutes</p>
                      <p className="text-sm text-[#6b7280] mt-3">Total Marks</p>
                      <p className="text-lg font-bold">{assignment.result.totalMarks}</p>
                    </div>

                    <div className="bg-[#111827] text-white rounded-lg overflow-hidden">
                      <div className="p-3 border-b border-white/10">
                        <p className="text-sm opacity-80">Preview</p>
                      </div>
                      <div className="p-4">
                        {assignment.result.pdfPath ? (
                          <iframe
                            src={`${getApiUrl()}/api/assessment/download/${jobId}`}
                            className="w-full h-48 rounded-md bg-white"
                            title="PDF Preview"
                          />
                        ) : (
                          <div className="h-48 flex items-center justify-center text-sm text-white/80">PDF preview not available</div>
                        )}
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          )}
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
                {assignment.metadata && (
                  <div className="mt-4 text-sm text-[#5e5e5e]">
                    <p>Model: {assignment.metadata.modelUsed || "n/a"}</p>
                    <p>Cache hit: {assignment.metadata.cacheHit ? "Yes" : "No"}</p>
                    <p>Attempts: {assignment.metadata.attempts}</p>
                  </div>
                )}
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
