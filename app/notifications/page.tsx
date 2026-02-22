"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "Project generated successfully",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      title: "New team member joined",
      time: "Yesterday",
      type: "info",
    },
    {
      id: 3,
      title: "Billing reminder",
      time: "3 days ago",
      type: "warning",
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
        <h1 className="text-3xl font-bold tracking-tight mb-8">Notifications</h1>

        <div className="flex flex-col gap-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="premium-card p-4 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{n.title}</span>
                <span className="text-gray-400 text-sm">{n.time}</span>
              </div>

              <span
                className={`px-3 py-1 rounded-smooth text-sm ${
                  n.type === "success"
                    ? "bg-green-600/20 text-green-400"
                    : n.type === "info"
                    ? "bg-blue-600/20 text-blue-400"
                    : "bg-yellow-600/20 text-yellow-400"
                }`}
              >
                {n.type}
              </span>
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
