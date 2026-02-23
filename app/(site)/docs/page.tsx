"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function DeveloperDocsPage() {
  const sections = [
    {
      title: "Authentication",
      description: "How to authenticate with your API keys.",
      link: "#auth",
    },
    {
      title: "Generate Code",
      description: "Use the Prestige Build API to generate code programmatically.",
      link: "#generate",
    },
    {
      title: "Webhooks",
      description: "Receive events from Prestige Build, Stripe, and Pawapay.",
      link: "#webhooks",
    },
    {
      title: "Examples",
      description: "Copy‑paste ready examples in JavaScript, Python, and cURL.",
      link: "#examples",
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

      {/* Hero */}
      <div className="text-center mt-20 fade-in px-6">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Developer <span className="text-accent">Documentation</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Everything you need to integrate Prestige Build into your applications.
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto mt-16 px-6">
        {sections.map((s) => (
          <Link
            key={s.title}
            href={s.link}
            className="premium-card p-6 hover:bg-white/5 transition-all"
          >
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="text-gray-400 text-sm mt-2">{s.description}</p>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
