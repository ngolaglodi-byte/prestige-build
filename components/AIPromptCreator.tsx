"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

interface AIPromptCreatorProps {
  onProjectCreated?: (projectId: string) => void;
}

const SUGGESTIONS = [
  { label: "CRM", prompt: "Un CRM moderne pour gérer les contacts, les deals et les activités commerciales" },
  { label: "Portfolio", prompt: "Un portfolio personnel élégant avec présentation des projets et formulaire de contact" },
  { label: "E-commerce", prompt: "Une boutique e-commerce avec catalogue produits, panier et paiement en ligne" },
  { label: "Blog", prompt: "Un blog avec gestion des articles, catégories, commentaires et newsletter" },
  { label: "Dashboard", prompt: "Un tableau de bord analytique avec graphiques, KPIs et rapports exportables" },
];

export default function AIPromptCreator({ onProjectCreated }: AIPromptCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    setPreview(null);
    setError(null);
  };

  const handleCreate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      setPreview(data.result ?? null);

      if (data.projectId && onProjectCreated) {
        onProjectCreated(data.projectId);
      }
    } catch (err) {
      console.error("[AIPromptCreator] fetch error:", err);
      setError("Impossible de contacter le serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Sparkles className="text-accent" size={24} />
        <h2 className="text-xl font-semibold text-white">Décrivez votre application</h2>
      </div>

      {/* Suggestions rapides */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => handleSuggestion(s.prompt)}
            className={`px-3 py-1.5 text-sm rounded-smooth border transition-all premium-hover ${
              prompt === s.prompt
                ? "border-accent bg-accent/20 text-accent"
                : "border-border bg-surface text-gray-300 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Zone de saisie */}
      <div className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setPreview(null);
            setError(null);
          }}
          placeholder="Ex : Une application de gestion de tâches avec priorités, étiquettes et vue calendrier…"
          rows={4}
          className="w-full bg-surface border border-border rounded-smooth px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none"
        />

        <button
          onClick={handleCreate}
          disabled={!prompt.trim() || loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accentDark text-white rounded-smooth font-medium transition-all premium-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Génération en cours…
            </>
          ) : (
            <>
              <Send size={18} />
              Créer le projet
            </>
          )}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-smooth text-red-400 text-sm fade-in">
          {error}
        </div>
      )}

      {/* Prévisualisation du résultat */}
      {preview && (
        <div className="flex flex-col gap-3 fade-in">
          <h3 className="text-sm font-medium text-gray-300">Aperçu généré</h3>
          <pre className="bg-surface border border-border rounded-smooth p-4 text-sm text-gray-300 overflow-auto max-h-64 whitespace-pre-wrap">
            {preview}
          </pre>
        </div>
      )}
    </div>
  );
}
