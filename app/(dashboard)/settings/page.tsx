"use client";

import { useState } from "react";
import { User, Shield, Palette, AlertTriangle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function GlobalSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [saved, setSaved] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (value: "dark" | "light") => {
    setTheme(value);
    showSaved();
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as "fr" | "en");
    showSaved();
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted mt-1 text-sm">
          {t("settings.subtitle")}
        </p>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-2 bg-green-900/30 border border-green-600 rounded-smooth text-green-400 text-sm">
          {t("settings.saved")}
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* Profile */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">{t("settings.profile")}</h2>
          </div>
          <p className="text-muted text-sm mb-4">
            {t("settings.profileDesc")}
          </p>
        </div>

        {/* Security */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">{t("settings.security")}</h2>
          </div>
          <p className="text-muted text-sm mb-4">
            {t("settings.securityDesc")}
          </p>
        </div>

        {/* Preferences */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">{t("settings.preferences")}</h2>
          </div>

          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="text-sm text-muted mb-2 block">{t("settings.appearance")}</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`px-4 py-2 rounded-smooth border text-sm transition-all ${
                    theme === "dark"
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t("settings.dark")}
                </button>
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`px-4 py-2 rounded-smooth border text-sm transition-all ${
                    theme === "light"
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-surface border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t("settings.light")}
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm text-muted mb-2 block">{t("settings.language")}</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-surface border border-border rounded-smooth px-4 py-2 text-sm focus:border-accent/50 outline-none transition-colors text-foreground"
              >
                <option value="fr">{t("settings.french")}</option>
                <option value="en">{t("settings.english")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-red-500/30 rounded-xlSmooth p-6 bg-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">{t("settings.dangerZone")}</h2>
          </div>
          <p className="text-muted text-sm mb-4">
            {t("settings.dangerDesc")}
          </p>
          <button className="px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-smooth text-sm hover:bg-red-600/30 transition-colors">
            {t("settings.deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
