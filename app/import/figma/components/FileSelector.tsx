"use client";

import React, { useState } from "react";

interface FigmaPage {
  id: string;
  name: string;
  childCount: number;
}

interface FileSelectorProps {
  token: string;
  onParsed: (data: { name: string; pages: FigmaPage[]; tree: unknown[] }) => void;
}

export default function FileSelector({ token, onParsed }: FileSelectorProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/figma/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, token }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        onParsed(data);
      }
    } catch {
      setError("Erreur lors du parsing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold">Sélectionner un fichier Figma</h2>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.figma.com/file/..."
        className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleParse}
        disabled={!url.trim() || loading}
        className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accentDark disabled:opacity-50 transition-colors"
      >
        {loading ? "Analyse en cours…" : "Analyser le fichier"}
      </button>
    </div>
  );
}
