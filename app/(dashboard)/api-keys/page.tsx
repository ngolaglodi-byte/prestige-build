"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

type ApiKey = { id: string; key: string; label: string; createdAt: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  function loadKeys() {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then((data) => {
        setKeys(data.keys ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function generateKey() {
    const label = prompt("Key label:", "Default");
    if (!label) return;
    await fetch("/api/api-keys", {
      method: "POST",
      body: JSON.stringify({ label }),
      headers: { "Content-Type": "application/json" },
    });
    loadKeys();
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this API key?")) return;
    await fetch("/api/api-keys", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    loadKeys();
  }

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
          Manage your API keys for accessing Prestige Build services and integrations.
        </p>

        <div className="flex flex-col gap-6">

          <button
            onClick={generateKey}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
          >
            Generate New API Key
          </button>

          {loading ? (
            <p className="text-gray-400">Loading API keys...</p>
          ) : keys.length === 0 ? (
            <p className="text-gray-400">No API keys yet. Generate one above.</p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="premium-card p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{k.label}</h2>
                  <span className="text-gray-500 text-xs">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type={showSecret[k.id] ? "text" : "password"}
                    readOnly
                    value={k.key}
                    className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300"
                  />
                  <button
                    onClick={() => setShowSecret((p) => ({ ...p, [k.id]: !p[k.id] }))}
                    className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
                  >
                    {showSecret[k.id] ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => copy(k.key)}
                    className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="px-3 py-2 bg-red-600/80 rounded-smooth hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
