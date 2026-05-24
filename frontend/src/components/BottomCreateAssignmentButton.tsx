"use client";

import Link from "next/link";
import { Star } from "lucide-react";

export default function BottomCreateAssignmentButton() {
  return (
    <Link
      href="/create"
      className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-[#272727] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition hover:bg-[#333] md:hidden"
    >
      <Star size={16} className="text-white" />
      Create Assignment
    </Link>
  );
}
