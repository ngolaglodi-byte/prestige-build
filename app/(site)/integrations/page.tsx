"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function IntegrationsPage() {
  const [connections, setConnections] = useState({
    github: false,
    vercel: false,
    supabase: false,
    stripe: false,
    pawapay: false,
  });

  const toggle = (key: keyof typeof connections) => {
    setConnections({ ...connections, [key]: !connections[key] });
  };

  const integrations = [
    {
      id: "github",
      name: "GitHub",
      description: "Connect your GitHub account to export repositories and sync code.",
      connected: connections.github,
      color: "text-white",
      bg: "bg-[#24292F]",
    },
    {
      id: "vercel",
      name: "Vercel",
      description: "Deploy your projects instantly with Vercel integration.",
      connected: connections.vercel,
      color: "text-white",
      bg: "bg-black",
    },
    {
      id: "supabase",
      name: "Supabase",
      description: "Connect your database and authentication with Supabase.",
      connected: connections.supabase,
      color: "text-white",
      bg: "bg-green-600",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Enable payments and billing using Stripe.",
      connected: connections.stripe,
      color: "text-white",
      bg: "bg-blue-600",
    },
    {
      id: "pawapay",
      name: "Pawapay",
      description: "Receive Mobile Money payments from Africa (M-Pesa, Airtel, MTN…).",
      connected: connections.pawapay,
      color: "text-white",
      bg: "bg-yellow-600",
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
        <h1 className="text-3xl font-bold tracking-tight mb-8">Integrations</h1>

        <p className="text-gray-400 mb-10">
          Connect external services to enhance your Prestige Build experience.
        </p>

        <div className="grid grid-cols-1 gap-6">
          {integrations.map((i) => (
            <div
              key={i.id}
              className="premium-card p-6 flex items-center justify-between"
            >
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-smooth flex items-center justify-center ${i.bg}`}>
                  <span className={`font-bold ${i.color}`}>{i.name[0]}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-lg font-semibold">{i.name}</span>
                  <span className="text-gray-400 text-sm">{i.description}</span>
                </div>
              </div>

              {/* Right */}
              <button
                onClick={() => toggle(i.id as keyof typeof connections)}
                className={`px-4 py-2 rounded-smooth premium-hover border ${
                  i.connected
                    ? "bg-accent border-accent shadow-soft"
                    : "bg-surface border-border"
                }`}
              >
                {i.connected ? "Connected" : "Connect"}
              </button>
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
