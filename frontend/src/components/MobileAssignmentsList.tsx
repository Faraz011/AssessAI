"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Bell, X } from "lucide-react";
import Sidebar from "./Sidebar";

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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "N/A";
  }
};

export default function MobileAssignmentsList({
  assignments,
  loading,
  onDelete,
  onNavigate,
}: MobileAssignmentsListProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Load profile image from localStorage if available
    try {
      const img = localStorage.getItem("assessai_profileImage");
      if (img) setProfileImage(img);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const filteredAssignments = assignments.filter((a) =>
    (a.input?.title || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="fixed inset-0 bg-[#f0f0f0] flex flex-col overflow-hidden">
      {/* Top Bar - Figma Design */}
      <div className="bg-white flex items-center justify-between pl-3 pr-4 py-4 flex-shrink-0 border-b border-gray-100 rounded-b-4xl">
        {/* Left: VedaAI Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-[8px] flex-shrink-0 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#ffb07a 0%,#e56820 50%,#a43a30 100%)",
            }}
          >
            <span className="text-white font-extrabold text-sm">V</span>
          </div>
          <span
            className="text-lg font-bold text-[#303030]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            VedaAI
          </span>
        </div>

        {/* Right: Bell, Avatar, Hamburger */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="bg-[#f6f6f6] rounded-full p-2 flex items-center justify-center hover:bg-gray-200 transition relative flex-shrink-0 w-9 h-9">
            <Bell className="w-5 h-5 text-[#303030]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5623] rounded-full" />
          </button>

          {/* Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5623] to-[#FF8A50] flex-shrink-0 overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">A</span>
            )}
          </div>

          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded-md transition flex-shrink-0 flex items-center justify-center"
          >
            <Menu className="w-6 h-6 text-[#303030]" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0 bg-white/50 border-b border-gray-100">
        <button className="flex items-center gap-2 text-[#a9a9a9] flex-shrink-0">
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
          <span
            className="text-sm whitespace-nowrap"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Filter
          </span>
        </button>
        <div className="border border-black/20 bg-white rounded-full px-3 py-2 flex-1 flex items-center gap-3">
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
            placeholder="Search Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm text-[#a9a9a9] outline-none flex-1 bg-transparent placeholder-[#a9a9a9]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
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
          <div className="px-4 py-4 space-y-4">
            {filteredAssignments.map((a) => (
              <div
                key={a.jobId}
                className="bg-white rounded-[24px] p-4 shadow-sm relative hover:shadow-md transition"
              >
                {/* Title and Menu */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <h3
                      className="text-base font-bold text-[#303030] flex-1 pr-2"
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontWeight: 700,
                        lineHeight: 1.4,
                      }}
                    >
                      {a.input?.title || "Untitled"}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === a.jobId ? null : a.jobId,
                          )
                        }
                        className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
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
                  <div className="flex gap-3 text-xs flex-col sm:flex-row">
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      <span className="font-bold text-[#303030]">
                        Assigned on
                      </span>
                      <span className="text-[rgba(0,0,0,0.5)]">
                        {" "}
                        : {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      <span className="font-bold text-[#303030]">Due</span>
                      <span className="text-[rgba(0,0,0,0.5)]">
                        {" "}
                        : {formatDate(a.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* iOS Home Indicator */}
      <div className="h-6 bg-white/80 flex items-center justify-center flex-shrink-0">
        <div className="w-32 h-1 bg-[#ddd] rounded-full" />
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full z-50 overflow-y-auto">
            <div className="flex items-start">
              <Sidebar />
              {/* Close button overlay */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-4 text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
