"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function ApiKeysPage() {
  const [publicKey] = useState("pk_live_xxxxxxxxxxxxx");
  const [secretKey, setSecretKey] = useState("sk_live_xxxxxxxxxxxxx");
  const [showSecret, setShowSecret] = useState(false);

  const [webhookUrl] = useState("https://prestigebuild.com/api/webhooks/pawapay");

  const regenerate = () => {
    setSecretKey("sk_live_" + Math.random().toString(36).substring(2, 18));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
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
        <h1 className="text-3xl font-bold tracking-tight mb-8">API Keys</h1>

        <p className="text-gray-400 mb-10">
          Manage your API keys for accessing Prestige Build services, integrations, and Pawapay webhooks.
        </p>

        <div className="flex flex-col gap-10">

          {/* PUBLIC KEY */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Public API Key</h2>

            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={publicKey}
                className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300"
              />
              <button
                onClick={() => copy(publicKey)}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
              >
                Copy
              </button>
            </div>
          </div>

          {/* SECRET KEY */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Secret API Key</h2>

            <div className="flex items-center gap-3">
              <input
                type={showSecret ? "text" : "password"}
                readOnly
                value={secretKey}
                className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300"
              />

              <button
                onClick={() => setShowSecret(!showSecret)}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
              >
                {showSecret ? "Hide" : "Show"}
              </button>

              <button
                onClick={() => copy(secretKey)}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
              >
                Copy
              </button>
            </div>

            <button
              onClick={regenerate}
              className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
            >
              Regenerate Secret Key
            </button>
          </div>

          {/* WEBHOOKS */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Webhook (Pawapay)</h2>

            <p className="text-gray-400 text-sm">
              Use this URL to receive Mobile Money payment events from Pawapay.
            </p>

            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300"
              />
              <button
                onClick={() => copy(webhookUrl)}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
              >
                Copy
              </button>
            </div>
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
