"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function UsagePage() {
  const usage = [
    { label: "AI Generations", used: 42, limit: 100 },
    { label: "Projects", used: 3, limit: 10 },
    { label: "Mobile Money Payments (Pawapay)", used: 12, limit: 50 },
    { label: "API Requests", used: 850, limit: 5000 },
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
        <h1 className="text-3xl font-bold tracking-tight mb-8">Usage & Limits</h1>

        <div className="flex flex-col gap-6">
          {usage.map((u) => {
            const percent = (u.used / u.limit) * 100;

            return (
              <div key={u.label} className="premium-card p-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{u.label}</span>
                  <span className="text-gray-400">
                    {u.used} / {u.limit}
                  </span>
                </div>

                <div className="w-full h-2 bg-surfaceLight rounded-smooth overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
