"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eee] to-[#dadada]">
      <Sidebar />
      <DashboardHeader />
      <div className="ml-[327px] mt-[72px]">
        {children}
      </div>
    </div>
  );
}
