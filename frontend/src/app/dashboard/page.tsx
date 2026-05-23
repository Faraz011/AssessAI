"use client";

import DashboardLayout from "@/components/DashboardLayout";
import AssignmentsEmptyState from "@/components/AssignmentsEmptyState";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <AssignmentsEmptyState />
    </DashboardLayout>
  );
}
