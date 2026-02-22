"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function AuditLogsPage() {
  const logs = [
    {
      id: 1,
      action: "User Login",
      detail: "Successful authentication",
      time: "2 hours ago",
      ip: "102.89.12.4",
    },
    {
      id: 2,
      action: "Mobile Money Payment",
      detail: "Pawapay payment received (M-Pesa)",
      time: "Yesterday",
      ip: "102.89.12.4",
    },
    {
      id: 3,
      action: "API Key Regenerated",
      detail: "Secret key updated",
      time: "3 days ago",
      ip: "102.89.12.4",
    },
    {
      id: 4,
      action: "Project Generated",
      detail: "Landing Page Starter",
      time: "1 week ago",
      ip: "102.89.12.4",
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
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Audit Logs</h1>

        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div key={log.id} className="premium-card p-4 flex justify-between">
              <div>
                <div className="font-semibold">{log.action}</div>
                <div className="text-gray-400 text-sm">{log.detail}</div>
                <div className="text-gray-500 text-xs mt-1">{log.time}</div>
              </div>

              <div className="text-gray-500 text-sm">
                IP: <span className="text-gray-300">{log.ip}</span>
              </div>
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
