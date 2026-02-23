"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type UsageItem = { action: string; totalTokens: number; totalCredits: number; count: number };

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data) => {
        setUsage(data.usage ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fallback = [
    { action: "AI Generations", totalTokens: 0, totalCredits: 0, count: 0 },
    { action: "API Requests", totalTokens: 0, totalCredits: 0, count: 0 },
  ];

  const items = usage.length > 0 ? usage : fallback;

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

        {loading ? (
          <p className="text-gray-400">Loading usage data...</p>
        ) : (
          <div className="flex flex-col gap-6">
            {items.map((u) => (
              <div key={u.action} className="premium-card p-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{u.action}</span>
                  <span className="text-gray-400">
                    {u.count} requests — {u.totalCredits} credits used
                  </span>
                </div>

                <div className="w-full h-2 bg-surfaceLight rounded-smooth overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.min(100, (u.count / 100) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
