"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import JobStatus from "@/components/JobStatus";
import { AssignmentResponse } from "@/types";
import { getApiUrl } from "@/lib/api-config";

export default function OutputPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const handleStatusChange = (status: AssignmentResponse) => setAssignment(status);
  const handleComplete = (result: AssignmentResponse) => setAssignment(result);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchStatus = async () => {
      try {
        setIsLoadingStatus(true);
        const res = await fetch(`${getApiUrl()}/api/assessment/status/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = (await res.json()) as AssignmentResponse;
        if (!mounted) return;
        setAssignment(data);

        if (data.status !== "done" && data.status !== "failed") {
          timer = setTimeout(fetchStatus, 3000);
        }
      } catch (err) {
        console.error("Status fetch error:", err);
        if (timer === null) timer = setTimeout(fetchStatus, 5000);
      } finally {
        if (mounted) setIsLoadingStatus(false);
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(`${getApiUrl()}/api/assessment/download/${jobId}`);
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
            <button onClick={() => router.push("/dashboard")} className="p-2 rounded-full bg-white hover:bg-[#f6f6f6] transition-colors">
              <ArrowLeft size={24} className="text-[#303030]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#303030]">Assignment Output</h1>
              <p className="text-sm text-[#5e5e5e]">Job ID: {jobId}</p>
            </div>
          </div>

          {/* Status Section - Hidden when done */}
          {!assignment?.result && (
            <div className="mb-8">
              <JobStatus jobId={jobId} onStatusChange={handleStatusChange} onComplete={handleComplete} />
              {isLoadingStatus && <p className="text-sm text-[#5e5e5e] mt-2">Checking status...</p>}
            </div>
          )}

          {/* Dark Header with Success Message and Download Button (Figma-style) */}
          {assignment?.result && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-[#1f2937] to-[#111827] rounded-3xl p-6 md:p-8 text-white shadow-lg">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg md:text-xl font-semibold">Your customized question paper</p>
                    <h2 className="text-2xl md:text-3xl font-bold mt-1">{assignment.input?.title}</h2>
                    <p className="text-sm text-[#d1d5db] mt-1">{assignment.input?.subject ? `${assignment.input.subject} • ` : ""}{assignment.input?.grade}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 bg-white text-[#111827] font-semibold px-5 py-3 rounded-full shadow hover:scale-[1.01] transition-transform disabled:opacity-60">
                      <Download size={18} />
                      {isDownloading ? "Downloading..." : "Download PDF"}
                    </button>

                    {assignment.input?.uploadedFile && (
                      <a href={`${getApiUrl()}/api/assessment/file/${jobId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white hover:bg-white/5">View Uploaded</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main preview */}
          {assignment?.result && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left: Paper preview */}
                  <div className="md:col-span-8 bg-white">
                    {/* School Header */}
                    <div className="text-center mb-6 pb-6 border-b border-[#e6e6e6]">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] mb-1">{assignment.result.sections?.[0]?.name ? "Delhi Public School, Sector-4, Bokaro" : "Question Paper"}</h2>
                      <p className="text-base text-[#374151] font-medium">Subject: {assignment.input?.subject || "General"} • Class: {assignment.input?.grade || "-"}</p>
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
                          <iframe src={`${getApiUrl()}/api/assessment/download/${jobId}`} className="w-full h-48 rounded-md bg-white" title="PDF Preview" />
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

          {/* Loading State */}
          {!assignment?.result && (
            <div className="bg-white rounded-3xl p-16 shadow-lg text-center">
              <div className="inline-block w-12 h-12 border-4 border-[#d4d4d4] border-t-[#303030] rounded-full animate-spin mb-4" />
              <p className="text-lg text-[#303030] font-semibold">Generating your question paper...</p>
              <p className="text-sm text-[#5e5e5e] mt-2">This may take a few moments. Please wait.</p>
            </div>
          )}

          {/* Error State */}
          {assignment?.error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
              <p className="text-red-700 font-bold text-lg mb-4">Error generating question paper</p>
              <p className="text-red-600 mb-6">{assignment.error}</p>
              <button onClick={() => router.push("/create")} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
 
