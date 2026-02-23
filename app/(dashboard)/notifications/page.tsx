"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

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

        {loading ? (
          <p className="text-gray-400">Loading notifications...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400">No notifications yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((n) => (
              <div
                key={n.id}
                className={`premium-card p-4 flex justify-between items-center ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{n.title}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
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
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Mark read
                    </button>
                  )}
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
