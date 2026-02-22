"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function ActivityLogPage() {
  const logs = [
    {
      id: 1,
      action: "Created new project",
      detail: "Landing Page Starter",
      time: "2 hours ago",
    },
    {
      id: 2,
      action: "Edited file",
      detail: "src/App.tsx",
      time: "Yesterday",
    },
    {
      id: 3,
      action: "Invited a team member",
      detail: "sarah@example.com",
      time: "3 days ago",
    },
    {
      id: 4,
      action: "Generated code with AI",
      detail: "Homepage layout",
      time: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Back to Dashboard
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Activity Log</h1>

        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="premium-card p-4 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{log.action}</span>
                <span className="text-gray-400 text-sm">{log.detail}</span>
              </div>

              <span className="text-gray-500 text-sm">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
