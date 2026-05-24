"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("assessai_userName") || "John Doe");
    setOrg(localStorage.getItem("assessai_orgName") || "Delhi Public School");
    setLocation(
      localStorage.getItem("assessai_orgLocation") || "Bokaro Steel City",
    );
  }, []);

  const save = () => {
    localStorage.setItem("assessai_userName", name);
    localStorage.setItem("assessai_orgName", org);
    localStorage.setItem("assessai_orgLocation", location);
    // notify sidebar
    window.dispatchEvent(new Event("assessai:settingsUpdated"));
    alert("Settings saved");
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>

        <div className="space-y-4 bg-white p-6 rounded-2xl shadow">
          <label className="block">
            <div className="text-sm font-medium mb-1">Full name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Organization</div>
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Location</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <div className="flex gap-2">
            <button
              onClick={save}
              className="bg-[#272727] text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => router.back()}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
