"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentsEmptyState from "@/components/AssignmentsEmptyState";
import { getApiUrl } from "@/lib/api-config";
import Link from "next/link";

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout>
      <div className="min-h-[60vh]">
        {loading ? (
          <div className="p-8">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <AssignmentsEmptyState />
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Assignments</h2>
              <Link href="/create" className="px-4 py-2 bg-black text-white rounded-md">Create Assignment</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <div key={a.jobId} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{a.input?.title || "Untitled"}</h3>
                      <p className="text-sm text-gray-500">{a.input?.subject || "General"} • {a.input?.grade}</p>
                      <p className="text-xs text-gray-400 mt-2">Created: {new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${a.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                      <div className="mt-3 flex flex-col gap-2">
                        {a.result?.pdfPath && (
                          <a href={a.downloadUrl} className="text-sm text-blue-600">Download PDF</a>
                        )}
                        <Link href={`/output/${a.jobId}`} className="text-sm text-gray-700">View</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
