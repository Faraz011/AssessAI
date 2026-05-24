"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface Assignment {
  jobId: string;
  input?: {
    title: string;
  };
  createdAt: string;
  updatedAt: string;
  status?: string;
}

interface MobileAssignmentsListProps {
  assignments: Assignment[];
  loading: boolean;
  onDelete: (jobId: string) => Promise<void>;
  onNavigate?: () => void;
}

export default function MobileAssignmentsList({
  assignments,
  loading,
  onDelete,
  onNavigate,
}: MobileAssignmentsListProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      setDeleting(jobId);
      await onDelete(jobId);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert("Failed to delete assignment");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewAssignment = (jobId: string) => {
    setOpenMenuId(null);
    onNavigate?.();
    router.push(`/output/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#f6f6f6] px-4 py-4 border-b border-[#e0e0e0]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <svg
              className="w-6 h-6 text-[#303030]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1
            className="text-xl font-bold text-[#303030]"
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
            }}
          >
            Assignments
          </h1>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-[20px] p-3 flex items-center gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-[#a9a9a9]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search Name"
            className="text-sm text-[#a9a9a9] outline-none flex-1 bg-transparent"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No assignments yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first assignment to get started
          </p>
          <Link
            href="/create"
            className="px-4 py-2 bg-[#FF5623] text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Create Assignment
          </Link>
        </div>
      ) : (
        <div className="flex-1 px-4 py-4 space-y-3">
          {assignments.map((a) => (
            <div
              key={a.jobId}
              className="bg-white rounded-[20px] p-4 shadow-sm relative"
            >
              {/* Title and Menu */}
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="text-base font-bold text-[#303030] flex-1 pr-2"
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {a.input?.title || "Untitled"}
                </h3>
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === a.jobId ? null : a.jobId)
                    }
                    className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === a.jobId && (
                    <div className="absolute right-0 top-8 bg-white rounded-[12px] shadow-lg z-20 overflow-hidden min-w-[140px] border border-[#e0e0e0]">
                      <button
                        onClick={() => handleViewAssignment(a.jobId)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-[#303030] font-medium transition flex items-center gap-2"
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(a.jobId)}
                        disabled={deleting === a.jobId}
                        className="w-full text-left px-3 py-2 hover:bg-[#f6f6f6] text-xs text-[#c53535] font-medium transition flex items-center gap-2 disabled:opacity-50"
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {deleting === a.jobId ? "..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-1">
                <div
                  className="text-xs text-[#303030]"
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  <span className="font-semibold">Assigned on</span>
                  <span className="text-[rgba(0,0,0,0.6)]">
                    : {new Date(a.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div
                  className="text-xs text-[#303030]"
                  style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  <span className="font-semibold">Due</span>
                  <span className="text-[rgba(0,0,0,0.6)]">
                    : {new Date(a.updatedAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      {assignments.length > 0 && (
        <Link
          href="/create"
          className="fixed bottom-24 right-4 w-14 h-14 bg-[#FF5623] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Link>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#353739] rounded-t-[20px] flex items-center justify-around px-4 py-3 border-t border-[#5E6268]">
        <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-white transition">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2.423-2.423a1 1 0 00-1.414-1.414L3 12zm18 0l-2.423 2.423a1 1 0 001.414 1.414L21 12zm-9 5a2 2 0 100-4 2 2 0 000 4z"
            />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>

        <button className="flex flex-col items-center gap-1 py-2 text-white transition">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3H5a2 2 0 00-2 2v4a2 2 0 002 2h4V3zm0 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h4v8zm6-18h4a2 2 0 012 2v4a2 2 0 01-2 2h-4V3zm0 18h4a2 2 0 002-2v-4a2 2 0 00-2-2h-4v8z" />
          </svg>
          <span className="text-xs font-medium">Assignments</span>
        </button>

        <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-white transition">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C6.228 6.228 2 10.228 2 15s4.228 8.772 10 8.772 10-4.228 10-8.772c0-4.772-4.228-8.772-10-8.772z"
            />
          </svg>
          <span className="text-xs font-medium">Library</span>
        </button>

        <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-white transition">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-xs font-medium">AI Toolkit</span>
        </button>
      </div>
    </div>
  );
}
