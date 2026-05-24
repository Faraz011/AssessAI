"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentsEmptyState from "@/components/AssignmentsEmptyState";
import MobileAssignmentsList from "@/components/MobileAssignmentsList";
import { getApiUrl } from "@/lib/api-config";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${getApiUrl()}/api/assessment?limit=20`);
        if (!mounted) return;
        if (!res.ok) {
          setAssignments([]);
        } else {
          const data = await res.json();
          setAssignments(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch assignments list", err);
        setAssignments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchList();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      setDeleting(jobId);
      const res = await fetch(`${getApiUrl()}/api/assessment/${jobId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.jobId !== jobId));
        setOpenMenuId(null);
      } else {
        alert("Failed to delete assignment");
      }
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert("Failed to delete assignment");
    } finally {
      setDeleting(null);
    }
  };

  if (isMobile) {
    return (
      <DashboardLayout>
        <MobileAssignmentsList
          assignments={assignments}
          loading={loading}
          onDelete={handleDelete}
          onNavigate={() => setOpenMenuId(null)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-200px)] flex flex-col gap-6 px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h1
              className="text-2xl font-bold text-[#303030]"
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                letterSpacing: "-0.8px",
              }}
            >
              Assignments
            </h1>
          </div>
          <p
            className="text-sm text-[rgba(94,94,94,0.55)]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Manage and create assignments for your classes.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-[20px] overflow-hidden p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#a9a9a9]"
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
            <span
              className="text-sm font-semibold text-[#a9a9a9]"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Filter By
            </span>
          </div>
          <div className="border border-[rgba(0,0,0,0.2)] rounded-full px-4 py-2 flex items-center gap-3 flex-1 max-w-sm">
            <svg
              className="w-5 h-5 text-[#a9a9a9]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search Assignment"
              className="text-sm text-[#a9a9a9] outline-none flex-1 bg-transparent"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            />
          </div>
        </div>

        {/* Content */}
        {isMobile ? (
          <MobileAssignmentsList
            assignments={assignments}
            loading={loading}
            onDelete={handleDelete}
            onNavigate={() => setOpenMenuId(null)}
          />
        ) : loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <AssignmentsEmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {assignments.map((a) => (
                <div
                  key={a.jobId}
                  className="bg-white rounded-[24px] p-6 shadow-[0px_16px_24px_rgba(0,0,0,0.15),0px_32px_48px_rgba(0,0,0,0.1)] flex flex-col justify-between h-40 relative"
                >
                  {/* Title and Menu */}
                  <div className="flex items-start justify-between mb-4">
                    <h3
                      className="text-2xl font-extrabold text-[#303030] flex-1"
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 800,
                        letterSpacing: "-0.96px",
                        lineHeight: 1.2,
                      }}
                    >
                      {a.input?.title || "Untitled"}
                    </h3>
                    <div className="relative ml-2">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === a.jobId ? null : a.jobId)
                        }
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <svg
                          className="w-6 h-6"
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
                        <div className="absolute right-0 top-8 bg-white rounded-[16px] shadow-[0px_16px_24px_rgba(0,0,0,0.2),0px_32px_24px_rgba(0,0,0,0.05)] z-10 overflow-hidden min-w-[160px]">
                          <button
                            onClick={() => {
                              router.push(`/output/${a.jobId}`);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-[#303030] font-medium transition flex items-center gap-2"
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
                            View Assignment
                          </button>
                          <button
                            onClick={() => handleDelete(a.jobId)}
                            disabled={deleting === a.jobId}
                            className="w-full text-left px-3 py-2 hover:bg-[#f6f6f6] text-sm text-[#c53535] font-medium transition flex items-center gap-2 disabled:opacity-50"
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
                            {deleting === a.jobId ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-sm">
                    <div
                      className="text-[rgba(0,0,0,0.5)]"
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      <span
                        className="font-extrabold text-[#303030]"
                        style={{ fontWeight: 800 }}
                      >
                        Assigned on
                      </span>
                      <span>
                        : {new Date(a.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <div
                      className="text-[rgba(0,0,0,0.5)]"
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      <span
                        className="font-extrabold text-[#303030]"
                        style={{ fontWeight: 800 }}
                      >
                        Due
                      </span>
                      <span>
                        : {new Date(a.updatedAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Assignment Button */}
            <div className="flex justify-center mt-44">
              <Link
                href="/create"
                className="px-6 py-3 bg-black text-white rounded-full font-semibold flex items-center gap-2 hover:bg-gray-900 transition-colors"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Assignment
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
