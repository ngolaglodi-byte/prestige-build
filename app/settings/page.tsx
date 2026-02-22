"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function GlobalSettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Dashboard
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">

        <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

        <div className="flex flex-col gap-10">

          {/* Theme */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Appearance</h2>

            <div className="flex gap-4">
              <button
                onClick={() => setTheme("dark")}
                className={`px-4 py-2 rounded-smooth border premium-hover ${
                  theme === "dark"
                    ? "bg-accent border-accent shadow-soft"
                    : "bg-surface border-border"
                }`}
              >
                Dark
              </button>

              <button
                onClick={() => setTheme("light")}
                className={`px-4 py-2 rounded-smooth border premium-hover ${
                  theme === "light"
                    ? "bg-accent border-accent shadow-soft"
                    : "bg-surface border-border"
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Language</h2>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-surfaceLight border border-border rounded-smooth px-4 py-2"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
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
