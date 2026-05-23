"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentsEmptyState from "@/components/AssignmentsEmptyState";
import { getApiUrl } from "@/lib/api-config";

export default function DashboardPage() {
  const router = useRouter();
  // no local state required; we'll redirect if latest exists

  useEffect(() => {
    let mounted = true;

    const checkLatest = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/assessment/latest`);
        if (!mounted) return;
        if (res.status === 204) {
          // no recent assignment
        } else if (res.ok) {
          const data = await res.json();
          if (data?.jobId) {
            // Navigate to the output page for the latest assignment
            router.push(`/output/${data.jobId}`);
            return;
          } else {
            // no recent assignment
          }
        } else {
          // no recent assignment
        }
      } catch (err) {
        console.error("Failed to check latest assignment", err);
        setHasLatest(false);
      } finally {
        /* noop */
      }
    };

    checkLatest();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <DashboardLayout>
      {/* If still loading, show empty state placeholder to avoid flash */}
      <AssignmentsEmptyState />
    </DashboardLayout>
  );
}
