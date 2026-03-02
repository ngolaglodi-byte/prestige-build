"use client";

import React from "react";

const SUGGESTIONS = [
  "Crée une app de gestion de tâches avec drag-and-drop",
  "Crée un dashboard analytics avec des graphiques",
  "Crée une page de login avec email et mot de passe",
  "Crée un blog avec liste d'articles et page de détail",
  "Crée un formulaire de contact avec validation",
  "Crée une landing page SaaS moderne",
];

interface PromptSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export default function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-left text-sm px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-accent hover:bg-[var(--surface-light)] transition-colors text-[var(--foreground)]"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
