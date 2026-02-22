"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Top Navigation */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
            Dashboard
          </Link>
          <Link
            href="/workspace/1"
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft"
          >
            Launch Workspace
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mt-32 px-6 fade-in">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Build Anything with <span className="text-accent">Prestige Build</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mb-10">
          Your AI-powered workspace to generate, edit, preview, and deploy full applications.
          Designed for speed, clarity, and a premium developer experience.
        </p>

        <div className="flex gap-4">
          <Link
            href="/workspace/1"
            className="px-6 py-3 bg-accent rounded-smooth text-lg premium-hover shadow-soft"
          >
            Start Building
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3 bg-surface rounded-smooth text-lg premium-hover border border-border"
          >
            View Projects
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()} — Crafted for creators.
      </div>
    </div>
  );
}
