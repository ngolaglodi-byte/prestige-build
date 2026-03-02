"use client";

import React, { useState } from "react";

interface FigmaConnectorProps {
  onConnected: (token: string) => void;
}

export default function FigmaConnector({ onConnected }: FigmaConnectorProps) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/figma/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.connected) {
        onConnected(token);
      } else {
        setError(data.error ?? "Connexion échouée");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold">Connexion Figma</h2>
      <p className="text-sm text-[var(--muted)]">
        Entrez votre token d&apos;accès personnel Figma pour importer vos designs.
      </p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="figd_..."
        className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleConnect}
        disabled={!token.trim() || loading}
        className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accentDark disabled:opacity-50 transition-colors"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
    </div>
  );
}
