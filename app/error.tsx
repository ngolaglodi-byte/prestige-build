"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale :", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-white">
      <div className="max-w-md w-full p-8 bg-surface border border-border rounded-xlSmooth shadow-strong text-center fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
        <p className="text-gray-400 text-sm mb-6">
          Quelque chose s&apos;est mal passé. Veuillez réessayer ou contacter le support si le problème persiste.
        </p>
        {error.digest && (
          <p className="text-gray-500 text-xs mb-4 font-mono">
            Réf\u00a0: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all duration-200 font-medium"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
