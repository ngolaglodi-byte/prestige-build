"use client";

import { useEffect, useState } from "react";
import { User, Shield, Palette, AlertTriangle } from "lucide-react";

export default function GlobalSettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("fr");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("prestige-theme");
    const savedLang = localStorage.getItem("prestige-language");
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleSave = (key: string, value: string) => {
    localStorage.setItem(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    handleSave("prestige-theme", value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    handleSave("prestige-language", value);
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Gérez votre profil, vos préférences et la sécurité de votre compte.
        </p>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-2 bg-green-900/30 border border-green-600 rounded-smooth text-green-400 text-sm">
          Préférences sauvegardées
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* Profile */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Profil utilisateur</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Votre profil est géré via Clerk. Cliquez sur votre avatar dans la barre supérieure pour modifier vos informations personnelles.
          </p>
        </div>

        {/* Security */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Sécurité</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            La sécurité de votre compte est assurée par Clerk. Vous pouvez gérer votre mot de passe, l&apos;authentification à deux facteurs et les appareils connectés depuis votre profil.
          </p>
        </div>

        {/* Preferences */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Préférences</h2>
          </div>

          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Apparence</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`px-4 py-2 rounded-smooth border text-sm transition-all ${
                    theme === "dark"
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-surface border-border text-gray-400 hover:text-white"
                  }`}
                >
                  Sombre
                </button>
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`px-4 py-2 rounded-smooth border text-sm transition-all ${
                    theme === "light"
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-surface border-border text-gray-400 hover:text-white"
                  }`}
                >
                  Clair
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Langue</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-surface border border-border rounded-smooth px-4 py-2 text-sm focus:border-accent/50 outline-none transition-colors"
              >
                <option value="fr" lang="fr">Français</option>
                <option value="en" lang="en">Anglais</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-red-500/30 rounded-xlSmooth p-6 bg-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Zone de danger</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            La suppression de votre compte est irréversible. Toutes vos données, projets et générations seront définitivement supprimés.
          </p>
          <button className="px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-smooth text-sm hover:bg-red-600/30 transition-colors">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
