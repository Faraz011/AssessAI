"use client";

import Link from "next/link";
import {
  Home,
  Users,
  FileText,
  Lightbulb,
  BookOpen,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  return (
    <div className="hidden md:flex bg-white drop-shadow-lg flex-col md:h-[756px] md:justify-between p-6 rounded-2xl md:w-[304px] md:fixed md:left-3 md:top-3">
      {/* Logo & Brand */}
      <div className="flex flex-col gap-14">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-[10px] bg-gradient-to-b from-[#e56820] to-[#d45e3e] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="text-[#303030] font-bold text-2xl tracking-tight">
            VedaAI
          </span>
        </div>

        {/* Create Assignment Button */}
        <Link
          href="/create"
          className="w-full border-4 border-[#ff7950] bg-[#272727] hover:bg-[#333] rounded-full py-2 px-6 md:px-11 flex items-center justify-center gap-2 transition group"
        >
          <span className="text-white text-lg">+</span>
          <span className="text-white font-medium text-sm">
            Create Assignment
          </span>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          {/* Home */}
          <Link
            href="/dashboard"
            className="flex gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
          >
            <Home size={20} className="text-[#5e5e5e]" />
            <span className="text-[16px] font-normal text-[rgba(94,94,94,0.8)] group-hover:text-[#303030]">
              Home
            </span>
          </Link>

          {/* My Groups */}
          <Link
            href="#"
            className="flex gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
          >
            <Users size={20} className="text-[#5e5e5e]" />
            <span className="text-[16px] font-normal text-[rgba(94,94,94,0.8)] group-hover:text-[#303030]">
              My Groups
            </span>
          </Link>

          {/* Assignments - Active */}
          <div className="flex gap-2 items-center px-3 py-2 rounded-lg bg-[#f0f0f0]">
            <FileText size={20} className="text-[#303030]" />
            <span className="text-[16px] font-medium text-[#303030]">
              Assignments
            </span>
          </div>

          {/* AI Teacher's Toolkit */}
          <Link
            href="#"
            className="flex gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
          >
            <Lightbulb size={20} className="text-[#5e5e5e]" />
            <span className="text-[16px] font-normal text-[rgba(94,94,94,0.8)] group-hover:text-[#303030]">
              AI Teacher's Toolkit
            </span>
          </Link>

          {/* My Library */}
          <Link
            href="#"
            className="flex gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
          >
            <BookOpen size={20} className="text-[#5e5e5e]" />
            <span className="text-[16px] font-normal text-[rgba(94,94,94,0.8)] group-hover:text-[#303030]">
              My Library
            </span>
          </Link>
        </nav>
      </div>

      {/* Bottom Section - Settings & Profile */}
      <div className="flex flex-col gap-2">
        {/* Settings */}
        <Link
          href="#"
          className="flex gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
        >
          <Settings size={20} className="text-[#5e5e5e]" />
          <span className="text-[16px] font-normal text-[rgba(94,94,94,0.8)] group-hover:text-[#303030]">
            Settings
          </span>
        </Link>

        {/* Profile Card */}
        <div className="bg-[#f0f0f0] rounded-2xl p-3 flex gap-3">
          <div className="w-14 h-14 rounded-lg bg-gray-300 flex-shrink-0 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-[#303030] truncate">
              Delhi Public School
            </p>
            <p className="text-[14px] font-normal text-[#5e5e5e] truncate">
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
