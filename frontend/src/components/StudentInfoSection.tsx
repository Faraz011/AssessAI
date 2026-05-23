"use client";

import { useState } from "react";
import { StudentInfo } from "@/types";

interface StudentInfoSectionProps {
  onInfoChange?: (info: StudentInfo) => void;
  initialInfo?: StudentInfo;
}

export default function StudentInfoSection({
  onInfoChange,
  initialInfo,
}: StudentInfoSectionProps) {
  const [info, setInfo] = useState<StudentInfo>(
    initialInfo || {
      name: "",
      rollNumber: "",
      section: "",
      date: new Date().toLocaleDateString(),
    },
  );

  const handleChange = (field: keyof StudentInfo, value: string) => {
    const updated = { ...info, [field]: value };
    setInfo(updated);
    onInfoChange?.(updated);
  };

  return (
    <div className="bg-white border-b-4 border-purple-600 p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Student Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Name */}
        <div>
          <div className="flex items-end gap-4 pb-2 border-b-2 border-gray-300">
            <label className="text-sm font-medium text-gray-600">Name:</label>
            <input
              type="text"
              value={info.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="flex-1 bg-transparent text-gray-900 font-medium outline-none"
              placeholder="________________"
            />
          </div>
        </div>

        {/* Roll Number */}
        <div>
          <div className="flex items-end gap-4 pb-2 border-b-2 border-gray-300">
            <label className="text-sm font-medium text-gray-600">
              Roll No:
            </label>
            <input
              type="text"
              value={info.rollNumber}
              onChange={(e) => handleChange("rollNumber", e.target.value)}
              className="flex-1 bg-transparent text-gray-900 font-medium outline-none"
              placeholder="________________"
            />
          </div>
        </div>

        {/* Section */}
        <div>
          <div className="flex items-end gap-4 pb-2 border-b-2 border-gray-300">
            <label className="text-sm font-medium text-gray-600">
              Section:
            </label>
            <input
              type="text"
              value={info.section}
              onChange={(e) => handleChange("section", e.target.value)}
              className="flex-1 bg-transparent text-gray-900 font-medium outline-none"
              placeholder="________________"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <div className="flex items-end gap-4 pb-2 border-b-2 border-gray-300">
            <label className="text-sm font-medium text-gray-600">Date:</label>
            <input
              type="text"
              value={info.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="flex-1 bg-transparent text-gray-900 font-medium outline-none"
              placeholder="________________"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
