"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getApiUrl } from "@/lib/api-config";

type QuestionType = {
  id: string;
  name: string;
  count: number;
  marks: number;
  type: "MCQ" | "ShortAnswer" | "LongAnswer" | "TrueFalse" | "FillInTheBlank";
  difficulty: "Easy" | "Moderate" | "Hard";
};

export default function CreateAssignment() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    { id: "1", name: "Multiple Choice Questions", count: 4, marks: 1, type: "MCQ", difficulty: "Easy" },
    { id: "2", name: "Short Questions", count: 3, marks: 2, type: "ShortAnswer", difficulty: "Moderate" },
    { id: "3", name: "Diagram/Graph-Based Questions", count: 5, marks: 5, type: "LongAnswer", difficulty: "Hard" },
    { id: "4", name: "Numerical Problems", count: 5, marks: 5, type: "ShortAnswer", difficulty: "Moderate" },
  ]);

  const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleQuestionCountChange = (id: string, delta: number) => {
    setQuestionTypes(
      questionTypes.map((qt) =>
        qt.id === id ? { ...qt, count: Math.max(0, qt.count + delta) } : qt,
      ),
    );
  };

  const handleMarksChange = (id: string, delta: number) => {
    setQuestionTypes(
      questionTypes.map((qt) =>
        qt.id === id ? { ...qt, marks: Math.max(0, qt.marks + delta) } : qt,
      ),
    );
  };

  const removeQuestionType = (id: string) => {
    setQuestionTypes(questionTypes.filter((qt) => qt.id !== id));
  };

  const addQuestionType = () => {
    const newId =
      Math.max(...questionTypes.map((qt) => parseInt(qt.id)), 0) + 1;
    setQuestionTypes([
      ...questionTypes,
      { id: newId.toString(), name: "New Question Type", count: 0, marks: 1, type: "ShortAnswer", difficulty: "Moderate" },
    ]);
  };

  const handleNext = async () => {
    // Validate required fields
    if (!title.trim()) {
      setError("Please enter an assignment title");
      return;
    }

    if (!grade.trim()) {
      setError("Please select a grade level");
      return;
    }

    if (totalQuestions === 0) {
      setError("Please add at least one question");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("grade", grade);
      
      // Send all question types with their custom settings
      formData.append(
        "sections",
        JSON.stringify(
          questionTypes
            .filter((qt) => qt.count > 0) // Only include sections with questions
            .map((qt) => ({
              name: qt.name,
              count: qt.count,
              marksPerQ: qt.marks,
              type: qt.type,
              difficulty: qt.difficulty,
            }))
        )
      );

      if (dueDate) {
        formData.append("dueDate", dueDate);
      }

      if (additionalInfo.trim()) {
        formData.append("instructions", additionalInfo);
      }

      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(
        `${getApiUrl()}/api/assessment/create`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to create assignment (${response.status})`,
        );
      }

      const data = await response.json();
      console.log("Assignment created:", data);

      // Navigate to output page with jobId
      router.push(`/output/${data.jobId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create assignment";
      setError(message);
      console.error("Create assignment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    // Go back to dashboard
    router.push("/dashboard");
  };

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-screen bg-gradient-to-b from-[#eee] to-[#dadada] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#303030]">
                  Create Assignment
                </h1>
                <p className="text-sm text-[#5e5e5e]">
                  Set up a new assignment for your students
                </p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#d4d4d4] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#303030] rounded-full"></div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-bold">{error}</p>
              </div>
            )}

            {/* Assignment Details Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#303030] mb-4">
                Assignment Details
              </h2>
              <p className="text-sm text-[#5e5e5e] mb-6">
                Basic information about your assignment
              </p>

              {/* Title Input */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-[#303030] mb-3">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., CBSE Grade 8 Science Midterm Exam"
                  className="w-full px-4 py-3 border-2 border-[#d4d4d4] rounded-lg text-[#303030] placeholder-[#a9a9a9] focus:outline-none focus:border-[#303030] transition-colors"
                />
              </div>

              {/* Grade Input */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-[#303030] mb-3">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#d4d4d4] rounded-lg text-[#303030] focus:outline-none focus:border-[#303030] transition-colors"
                >
                  <option value="">Select Grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-[#d4d4d4] rounded-2xl p-8 text-center mb-6 hover:border-[#303030] transition-colors cursor-pointer bg-[#f6f6f6]">
                <div className="flex justify-center mb-3">
                  <svg
                    className="w-8 h-8 text-[#a9a9a9]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>
                <p className="text-[#303030] font-bold mb-1">
                  Choose a file or drag & drop it here
                </p>
                <p className="text-[#5e5e5e] text-sm mb-4">
                  JPG, PNG or PDF, file size no more than 10MB
                </p>
                <label className="inline-block px-6 py-2 bg-[#181818] text-white rounded-full text-sm font-bold cursor-pointer hover:bg-[#303030] transition-colors">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                </label>
                {file && (
                  <p className="mt-3 text-[#22c55e] text-sm">{file.name}</p>
                )}
              </div>

              <p className="text-[#5e5e5e] text-xs mb-6">
                Upload images of your preferred document/image
              </p>

              {/* Due Date */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-[#303030] mb-3">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-3 border-2 border-[#d4d4d4] rounded-lg text-[#303030] placeholder-[#a9a9a9] focus:outline-none focus:border-[#303030] transition-colors"
                />
              </div>

              {/* Question Types Section */}
              <div className="mb-8">
                <h3 className="text-base font-bold text-[#303030] mb-6">
                  Question Type
                </h3>

                <div className="space-y-4">
                  {questionTypes.map((qt) => (
                    <div
                      key={qt.id}
                      className="p-4 bg-[#f6f6f6] rounded-lg hover:bg-[#f0f0f0] transition-colors"
                    >
                      {/* Top Row: Name, Type, Difficulty, Remove */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* Question Type Name */}
                        <input
                          type="text"
                          value={qt.name}
                          onChange={(e) => {
                            setQuestionTypes(
                              questionTypes.map((q) =>
                                q.id === qt.id ? { ...q, name: e.target.value } : q
                              )
                            );
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-[#d4d4d4] rounded-lg text-[#303030] text-sm focus:outline-none focus:border-[#303030]"
                          placeholder="Question Type Name"
                        />

                        {/* Type Dropdown */}
                        <select
                          value={qt.type}
                          onChange={(e) => {
                            setQuestionTypes(
                              questionTypes.map((q) =>
                                q.id === qt.id
                                  ? { ...q, type: e.target.value as QuestionType["type"] }
                                  : q
                              )
                            );
                          }}
                          className="px-3 py-2 bg-white border border-[#d4d4d4] rounded-lg text-[#303030] text-sm focus:outline-none focus:border-[#303030]"
                        >
                          <option value="MCQ">MCQ</option>
                          <option value="ShortAnswer">Short Answer</option>
                          <option value="LongAnswer">Long Answer</option>
                          <option value="TrueFalse">True/False</option>
                          <option value="FillInTheBlank">Fill in Blank</option>
                        </select>

                        {/* Difficulty Dropdown */}
                        <select
                          value={qt.difficulty}
                          onChange={(e) => {
                            setQuestionTypes(
                              questionTypes.map((q) =>
                                q.id === qt.id
                                  ? { ...q, difficulty: e.target.value as QuestionType["difficulty"] }
                                  : q
                              )
                            );
                          }}
                          className="px-3 py-2 bg-white border border-[#d4d4d4] rounded-lg text-[#303030] text-sm focus:outline-none focus:border-[#303030]"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Hard">Hard</option>
                        </select>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeQuestionType(qt.id)}
                          className="p-2 text-[#a9a9a9] hover:text-red-500 transition-colors"
                          title="Remove question type"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Bottom Row: Count and Marks */}
                      <div className="flex gap-3">
                        {/* Number of Questions */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <label className="text-xs font-bold text-[#303030]">
                            No. of Questions
                          </label>
                          <div className="flex items-center bg-white rounded-full px-2 py-1 border border-[#d4d4d4] w-full justify-between">
                            <button
                              onClick={() => handleQuestionCountChange(qt.id, -1)}
                              className="p-1 text-[#a9a9a9] hover:text-[#303030] transition-colors"
                            >
                              −
                            </button>
                            <span className="font-bold text-[#303030]">
                              {qt.count}
                            </span>
                            <button
                              onClick={() => handleQuestionCountChange(qt.id, 1)}
                              className="p-1 text-[#a9a9a9] hover:text-[#303030] transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Marks Per Question */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <label className="text-xs font-bold text-[#303030]">
                            Marks per Q
                          </label>
                          <div className="flex items-center bg-white rounded-full px-2 py-1 border border-[#d4d4d4] w-full justify-between">
                            <button
                              onClick={() => handleMarksChange(qt.id, -1)}
                              className="p-1 text-[#a9a9a9] hover:text-[#303030] transition-colors"
                            >
                              −
                            </button>
                            <span className="font-bold text-[#303030]">
                              {qt.marks}
                            </span>
                            <button
                              onClick={() => handleMarksChange(qt.id, 1)}
                              className="p-1 text-[#a9a9a9] hover:text-[#303030] transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Total Marks Display */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <label className="text-xs font-bold text-[#303030]">
                            Total Marks
                          </label>
                          <div className="flex items-center justify-center px-4 py-2 bg-white rounded-lg border border-[#d4d4d4] h-[36px]">
                            <span className="font-bold text-[#303030]">
                              {qt.count * qt.marks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Question Type Button */}
                <button
                  onClick={addQuestionType}
                  className="mt-4 flex items-center gap-2 px-4 py-3 bg-[#2b2b2b] text-white rounded-lg font-bold hover:bg-[#303030] transition-colors"
                >
                  <Plus size={20} />
                  Add Question Type
                </button>

                {/* Totals */}
                <div className="mt-6 text-right space-y-1">
                  <p className="text-sm text-[#5e5e5e]">
                    Total Questions:{" "}
                    <span className="font-bold text-[#303030]">
                      {totalQuestions}
                    </span>
                  </p>
                  <p className="text-sm text-[#5e5e5e]">
                    Total Marks:{" "}
                    <span className="font-bold text-[#303030]">
                      {totalMarks}
                    </span>
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h3 className="text-base font-bold text-[#303030] mb-3">
                  Additional Information (For better output)
                </h3>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className="w-full px-4 py-3 border-2 border-[#d4d4d4] rounded-lg text-[#303030] placeholder-[#a9a9a9] focus:outline-none focus:border-[#303030] transition-colors resize-none h-24"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-[#d4d4d4]">
              <button
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="px-6 py-2 border-2 border-[#303030] text-[#303030] rounded-full font-bold hover:bg-[#f6f6f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#181818] text-white rounded-full font-bold hover:bg-[#303030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Next →"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
