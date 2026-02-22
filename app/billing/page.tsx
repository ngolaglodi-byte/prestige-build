"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function BillingPage() {
  const [method, setMethod] = useState("mobile");

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
        <h1 className="text-3xl font-bold tracking-tight mb-8">Billing & Payments</h1>

        {/* Payment Method */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Payment Method</h2>

          <div className="flex gap-4">
            <button
              onClick={() => setMethod("mobile")}
              className={`px-4 py-2 rounded-smooth border premium-hover transition-all ${
                method === "mobile"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-surface text-gray-300 hover:text-white"
              }`}
            >
              Mobile Money
            </button>

            <button
              onClick={() => setMethod("card")}
              className={`px-4 py-2 rounded-smooth border premium-hover transition-all ${
                method === "card"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-surface text-gray-300 hover:text-white"
              }`}
            >
              Bank Card
            </button>
          </div>

          {method === "mobile" && (
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-sm text-gray-300">Mobile Money Number</label>
              <input
                type="text"
                placeholder="+243 970 000 000"
                className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {method === "card" && (
            <p className="text-gray-400 text-sm mt-4">
              Card payments coming soon.
            </p>
          )}
        </div>

        {/* Subscription */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Subscription</h2>

          <p className="text-gray-400">
            You are currently on the <span className="text-accent">Free Plan</span>.
          </p>

          <Link
            href="/pricing"
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
