"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  FileText,
  Lightbulb,
  BookOpen,
  Settings,
  Star,
} from "lucide-react";

export default function Sidebar() {
  const [orgName, setOrgName] = useState("Delhi Public School");
  const [orgLocation, setOrgLocation] = useState("Bokaro Steel City");

  useEffect(() => {
    const onSettings = () => {
      try {
        const o2 = localStorage.getItem("assessai_orgName");
        const l2 = localStorage.getItem("assessai_orgLocation");
        if (o2) setOrgName(o2);
        if (l2) setOrgLocation(l2);
      } catch (e) {
        /* ignore */
      }
    };

    try {
      const o = localStorage.getItem("assessai_orgName");
      const l = localStorage.getItem("assessai_orgLocation");
      if (o) setOrgName(o);
      if (l) setOrgLocation(l);
    } catch (e) {
      /* ignore */
    }

    window.addEventListener("assessai:settingsUpdated", onSettings as EventListener);
    return () => window.removeEventListener("assessai:settingsUpdated", onSettings as EventListener);
  }, []);

  return (
    <div className="bg-white drop-shadow-lg flex flex-col h-[756px] justify-between p-6 rounded-2xl w-[304px] fixed left-3 top-3">
      {/* Logo & Brand */}
      <div className="flex flex-col gap-14">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-[10px] flex-shrink-0 relative overflow-hidden flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#ffb07a 0%,#e56820 50%,#a43a30 100%)",
            }}
          >
            <div className="absolute inset-0 rounded-[10px]" />
            <div className="absolute top-0 left-0 h-1/2 w-1/2 rounded-full bg-white/10 blur-[6px] -translate-x-2 -translate-y-2" />
            <span className="relative text-white font-extrabold text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.28)]" style={{ transform: "translateY(-1px)" }}>V</span>
          </div>
          <span className="text-[#303030] font-bold text-2xl tracking-tight">
            VedaAI
          </span>
        </div>

        {/* Create Assignment Button */}
        <Link
          href="/create"
          className="w-full border-4 border-[#ff7950] bg-[#272727] hover:bg-[#333] rounded-full py-2 px-4 flex items-center justify-center gap-2 transition group"
        >
          <Star size={16} className="text-white" />
          <span className="text-white font-medium text-sm">Create Assignment</span>
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
          href="/settings"
          className="flex gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
        >
          <Settings size={20} className="text-[#5e5e5e]" />
          <span className="text-[16px] font-normal text-[rgba(94,94,94,0.8)] group-hover:text-[#303030]">
            Settings
          </span>
        </Link>

        {/* Profile Card */}
        <div className="bg-[#f0f0f0] rounded-2xl p-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-[#303030] truncate leading-tight">
              {orgName}
            </p>
            <p className="mt-1 text-[14px] font-normal text-[#5e5e5e] truncate leading-tight">
              {orgLocation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
