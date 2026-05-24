"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export default function AssignmentsEmptyState() {
  return (
    <div className="fixed md:top-28 md:left-96 md:right-3 md:bottom-3 top-20 left-4 right-4 bottom-4 flex flex-col items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 rounded-2xl">
      {/* Illustration Container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
        {/* Background Shape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-60 h-60">
            {/* Decorative doodles - circles and lines */}
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 border-2 border-purple-300 rounded-full opacity-20"></div>

            {/* Main illustration card */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Document card */}
                <div className="w-32 h-48 bg-white rounded-2xl shadow-xl relative overflow-hidden">
                  {/* Card header */}
                  <div className="bg-[#011625] h-8 w-16 rounded-full m-4 mb-6"></div>
                  {/* Card lines */}
                  <div className="px-4 space-y-3">
                    <div className="bg-gray-300 h-2 rounded-full"></div>
                    <div className="bg-gray-300 h-2 rounded-full"></div>
                    <div className="bg-gray-300 h-2 rounded-full"></div>
                  </div>
                </div>

                {/* Search/Magnifying glass with X - top right */}
                <div className="absolute -top-2 right-0 w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-purple-300">
                  <span className="text-4xl text-red-500">✕</span>
                </div>

                {/* Pen/pencil - top left */}
                <div className="absolute -top-6 -left-6 w-12 h-12 transform rotate-45">
                  <div className="w-full h-full bg-gray-400 rounded-full opacity-50"></div>
                </div>

                {/* Small cloud */}
                <div className="absolute top-12 right-32 w-16 h-8 bg-gray-200 rounded-full opacity-60"></div>

                {/* Small sparkles */}
                <div className="absolute bottom-32 right-16 w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="absolute top-48 left-16 w-3 h-3 bg-blue-300 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center mb-8 max-w-xl px-4">
        <h2 className="text-[#303030] text-2xl font-bold mb-3 tracking-tight">
          No assignments yet
        </h2>
        <p className="text-gray-700 text-base leading-relaxed">
          Create your first assignment to start collecting and grading student
          submissions. You can set up rubrics, define marking criteria, and let
          AI assist with grading.
        </p>
      </div>

      {/* CTA Button */}
      <Link
        href="/create"
        className="bg-[#181818] border-2 border-white/50 hover:bg-[#222] transition rounded-full px-8 md:px-12 py-3 flex items-center gap-2 text-white font-medium shadow-lg"
      >
        <Plus size={20} className="text-white" />
        <span>Create Your First Assignment</span>
      </Link>
    </div>
  );
}
