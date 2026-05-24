"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function DashboardHeader() {
  const [userName, setUserName] = useState("John Doe");

  useEffect(() => {
    const onSettings = () => {
      try {
        const n = localStorage.getItem("assessai_userName");
        if (n) setUserName(n);
      } catch (e) {
        /* ignore */
      }
    };

    try {
      const n = localStorage.getItem("assessai_userName");
      if (n) setUserName(n);
    } catch (e) {
      /* ignore */
    }

    window.addEventListener(
      "assessai:settingsUpdated",
      onSettings as EventListener,
    );
    return () =>
      window.removeEventListener(
        "assessai:settingsUpdated",
        onSettings as EventListener,
      );
  }, []);

  return (
    <div className="fixed top-3 left-[327px] right-3 z-20 flex h-14 items-center rounded-[18px] border border-black/5 bg-white px-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <Link
        href="/"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-[#f4f4f4]"
      >
        <ArrowLeft size={24} className="text-[#303030]" />
      </Link>

      <div className="flex flex-1 items-center gap-2 pl-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f3f3f3] text-[#b3b3b3]">
          <LayoutGrid size={14} strokeWidth={2.1} />
        </div>
        <span className="text-[16px] font-medium tracking-[-0.02em] text-[#b7b7b7]">
          Assignment
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-full p-2 transition hover:bg-[#f4f4f4]">
          <Bell size={24} className="text-[#141414]" />
          <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff5a32]" />
        </button>

        <button className="flex items-center gap-2 rounded-full px-1 py-1 pr-2 transition hover:bg-[#f4f4f4]">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#e8c7b4] to-[#d39d84]">
            <span className="text-sm">👤</span>
          </div>
          <span className="text-[16px] font-medium text-[#303030]">
            {userName}
          </span>
          <ChevronDown size={16} className="text-[#303030]" />
        </button>
      </div>
    </div>
  );
}
