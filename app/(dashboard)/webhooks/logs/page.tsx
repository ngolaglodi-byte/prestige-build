"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function WebhookLogsPage() {
  const [selected, setSelected] = useState<typeof logs[number] | null>(null);

  const logs = [
    {
      id: "evt_001",
      status: "success",
      source: "Pawapay",
      event: "payment.completed",
      time: "2 hours ago",
      payload: {
        amount: 1500,
        currency: "USD",
        phone: "+243 970 000 000",
        provider: "M-Pesa",
      },
    },
    {
      id: "evt_002",
      status: "failed",
      source: "Stripe",
      event: "invoice.payment_failed",
      time: "Yesterday",
      payload: {
        invoice_id: "inv_123",
        reason: "card_declined",
      },
    },
    {
      id: "evt_003",
      status: "success",
      source: "Prestige Build",
      event: "project.generated",
      time: "3 days ago",
      payload: {
        project: "Landing Page Starter",
        user: "glody@example.com",
      },
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
      <div className="max-w-5xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Webhook Logs</h1>

        <p className="text-gray-400 mb-10">
          View all webhook events received from Stripe, Pawapay, and other integrations.
        </p>

        <div className="grid grid-cols-3 gap-6">

          {/* LEFT: Logs list */}
          <div className="col-span-1 flex flex-col gap-4">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className={`premium-card p-4 text-left transition-all ${
                  selected?.id === log.id ? "border-accent shadow-soft" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{log.event}</span>

                  <span
                    className={`px-2 py-1 rounded-smooth text-xs ${
                      log.status === "success"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm">{log.source}</p>
                <p className="text-gray-500 text-xs mt-1">{log.time}</p>
              </button>
            ))}
          </div>

          {/* RIGHT: Log details */}
          <div className="col-span-2">
            {selected ? (
              <div className="premium-card p-6 flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Event Details</h2>

                <div className="flex justify-between">
                  <span className="text-gray-400">Event ID</span>
                  <span>{selected.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Source</span>
                  <span>{selected.source}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Event</span>
                  <span>{selected.event}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`px-2 py-1 rounded-smooth text-xs ${
                      selected.status === "success"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Received</span>
                  <span>{selected.time}</span>
                </div>

                <div className="h-px bg-border my-4"></div>

                <h3 className="text-lg font-semibold">Payload</h3>

                <pre className="bg-surfaceLight border border-border rounded-smooth p-4 text-sm overflow-auto">
{JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="premium-card p-6 text-gray-400 text-center">
                Select a webhook event to view details.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
