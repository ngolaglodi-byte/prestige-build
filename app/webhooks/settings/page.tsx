"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function WebhookSettingsPage() {
  const [endpoint, setEndpoint] = useState("https://prestigebuild.com/api/webhooks/pawapay");
  const [secret, setSecret] = useState("whsec_xxxxxxxxxxxxx");
  const [showSecret, setShowSecret] = useState(false);

  const regenerate = () => {
    setSecret("whsec_" + Math.random().toString(36).substring(2, 18));
  };

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

        <h1 className="text-3xl font-bold tracking-tight mb-8">Webhook Settings</h1>

        {/* Endpoint */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Webhook Endpoint</h2>

          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300 focus:outline-none focus:border-accent"
          />

          <p className="text-gray-400 text-sm">
            This URL will receive events from Prestige Build, Stripe, and Pawapay.
          </p>
        </div>

        {/* Signing Secret */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Signing Secret</h2>

          <div className="flex items-center gap-3">
            <input
              type={showSecret ? "text" : "password"}
              readOnly
              value={secret}
              className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300"
            />

            <button
              onClick={() => setShowSecret(!showSecret)}
              className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
            >
              {showSecret ? "Hide" : "Show"}
            </button>

            <button
              onClick={() => navigator.clipboard.writeText(secret)}
              className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
            >
              Copy
            </button>
          </div>

          <button
            onClick={regenerate}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
          >
            Regenerate Secret
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
