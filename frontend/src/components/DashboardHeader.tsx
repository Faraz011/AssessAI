"use client";

import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";

export default function DashboardHeader() {
  return (
    <div className="bg-white/75 backdrop-blur-md fixed top-3 left-3 right-3 md:left-[327px] md:right-3 flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl h-14 md:w-[calc(100%-351px)]">
      {/* Back Button */}
      <Link
        href="/"
        className="flex items-center justify-center bg-white hover:bg-gray-50 rounded-full w-10 h-10 transition flex-shrink-0"
      >
        <ArrowLeft size={24} className="text-[#303030]" />
      </Link>

      {/* Title */}
      <div className="flex items-center gap-2 flex-1">
        <div className="text-[20px] text-[#a9a9a9]">📋</div>
        <span className="text-[16px] font-semibold text-[#a9a9a9]">
          Assignment
        </span>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification Bell */}
        <button className="bg-[#f6f6f6] hover:bg-gray-200 transition rounded-full p-2 relative">
          <Bell size={24} className="text-[#303030]" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></div>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full drop-shadow-lg bg-white/95">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">👤</span>
          </div>
          <span className="text-[16px] font-semibold text-[#303030]">
            John Doe
          </span>
          <svg
            className="w-4 h-4 text-[#303030]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
