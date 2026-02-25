"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import fr from "@/lib/translations/fr";
import en from "@/lib/translations/en";

type Language = "fr" | "en";
type TranslationKey = keyof typeof fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const translations: Record<Language, Record<string, string>> = { fr, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = typeof window !== "undefined"
        ? localStorage.getItem("prestige-language") as Language | null
        : null;
      if (saved === "fr" || saved === "en") return saved;
    } catch {
      // localStorage unavailable
    }
    return "fr";
  });
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    localStorage.setItem("prestige-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
