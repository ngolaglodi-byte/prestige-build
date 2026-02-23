"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GlobalSettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("fr");
  const [saved, setSaved] = useState(false);

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("prestige-theme");
    const savedLang = localStorage.getItem("prestige-language");
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem("prestige-theme", value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem("prestige-language", value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

        <h1 className="text-3xl font-bold tracking-tight mb-8">Paramètres</h1>

        {saved && (
          <div className="mb-4 px-4 py-2 bg-green-900/30 border border-green-600 rounded-smooth text-green-400 text-sm">
            Préférences sauvegardées
          </div>
        )}

        <div className="flex flex-col gap-10">

          {/* Theme */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Apparence</h2>

            <div className="flex gap-4">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`px-4 py-2 rounded-smooth border premium-hover ${
                  theme === "dark"
                    ? "bg-accent border-accent shadow-soft"
                    : "bg-surface border-border"
                }`}
              >
                Sombre
              </button>

              <button
                onClick={() => handleThemeChange("light")}
                className={`px-4 py-2 rounded-smooth border premium-hover ${
                  theme === "light"
                    ? "bg-accent border-accent shadow-soft"
                    : "bg-surface border-border"
                }`}
              >
                Clair
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Langue</h2>

            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-surfaceLight border border-border rounded-smooth px-4 py-2"
            >
              <option value="fr" lang="fr">Français</option>
              <option value="en" lang="en">English</option>
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
