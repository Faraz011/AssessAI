"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Upload, X, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";

export default function AssignmentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    title: string;
    subject?: string;
    grade: string;
    dueDate?: string;
    questionTypes: string[];
    sectionA: number;
    sectionB: number;
    sectionC: number;
    instructions?: string;
  }>({
    defaultValues: {
      grade: "Grade 10",
      sectionA: 5,
      sectionB: 5,
      sectionC: 5,
      questionTypes: ["MCQ"],
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (
        [
          "application/pdf",
          "text/plain",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError("Only PDF, TXT, and DOCX files are supported");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", data.title);
      if (data.subject) formData.append("subject", data.subject);
      formData.append("grade", data.grade);
      formData.append("questionTypes", JSON.stringify(data.questionTypes));
      if (data.instructions) formData.append("instructions", data.instructions);

      if (uploadedFile) {
        formData.append("file", uploadedFile);
      }

      formData.append("numQuestions[sectionA]", data.sectionA);
      formData.append("numQuestions[sectionB]", data.sectionB);
      formData.append("numQuestions[sectionC]", data.sectionC);

      const response = await fetch(
        `${getApiUrl()}/api/assessment/create`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create assessment");
      }

      const result = await response.json();
      const { jobId } = result;

      // Redirect to output page
      router.push(`/output/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Assessment
          </h1>
          <p className="text-lg text-gray-600">
            Generate a customized question paper in seconds
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Assessment Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Photosynthesis"
                {...register("title", { required: "Title is required" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Science"
                {...register("subject")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Grade *
              </label>
              <select
                {...register("grade", { required: "Grade is required" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              >
                {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map(
                  (grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Due Date
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Question Types
              </label>
              <div className="space-y-2">
                {[
                  "MCQ",
                  "ShortAnswer",
                  "LongAnswer",
                  "TrueFalse",
                  "FillInTheBlank",
                ].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      value={type}
                      {...register("questionTypes")}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">
                      {type === "MCQ"
                        ? "Multiple Choice"
                        : type === "ShortAnswer"
                          ? "Short Answer"
                          : type === "LongAnswer"
                            ? "Long Answer"
                            : type === "TrueFalse"
                              ? "True/False"
                              : "Fill in the Blank"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div className="grid grid-cols-3 gap-4">
              {["sectionA", "sectionB", "sectionC"].map((section, i) => {
                const fieldName = section as
                  | "sectionA"
                  | "sectionB"
                  | "sectionC";
                return (
                  <div key={section}>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Section {String.fromCharCode(65 + i)} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      {...register(fieldName, {
                        required: `Section ${String.fromCharCode(65 + i)} is required`,
                        min: { value: 1, message: "Minimum 1" },
                        max: { value: 50, message: "Maximum 50" },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                    {errors[fieldName] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[fieldName]?.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Instructions
              </label>
              <textarea
                placeholder="Any special instructions for question generation..."
                {...register("instructions")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Upload Reference (Optional)
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
                  dragActive
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Upload className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-gray-900 font-medium">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Drag and drop or click to upload PDF, TXT, or DOCX
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Max file size: 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Assessment"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
