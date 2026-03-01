"use client";

import { useState } from "react";

export interface PreviewError {
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
}

interface Props {
  error: PreviewError;
  onDismiss: () => void;
  projectId?: string;
  fileContent?: string;
  onFixApplied?: (fixedContent: string) => void;
}

export function ErrorOverlay({ error, onDismiss, projectId, fileContent, onFixApplied }: Props) {
  const [fixing, setFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  const handleFixWithAI = async () => {
    if (!projectId || !fileContent) return;

    setFixing(true);
    setFixError(null);

    try {
      const res = await fetch("/api/ai/fix-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, error, fileContent }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Échec de la correction");
      }

      const { fixedContent } = await res.json();
      onFixApplied?.(fixedContent);
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setFixing(false);
    }
  };

  const canFix = !!projectId && !!fileContent && !!onFixApplied;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg mx-4 bg-[#1a0000] border border-red-900/50 rounded-xlSmooth shadow-strong overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/30 bg-red-950/40">
          <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
            <span className="h-2 w-2 bg-red-500 rounded-full" />
            Erreur d&apos;exécution
          </div>
          <div className="flex items-center gap-2">
            {canFix && (
              <button
                onClick={handleFixWithAI}
                disabled={fixing}
                className="text-xs px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-500/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {fixing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Correction…
                  </>
                ) : (
                  "🤖 Corriger avec l\u2019IA"
                )}
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-red-400/60 hover:text-red-300 text-xs px-2 py-0.5 rounded hover:bg-red-900/30 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="px-4 py-3">
          <p className="text-red-300 text-sm font-medium break-words">
            {error.message}
          </p>

          {/* Fichier source */}
          {error.file && (
            <div className="mt-2 text-xs text-red-400/70">
              📄 {error.file}
              {error.line != null && `:${error.line}`}
              {error.column != null && `:${error.column}`}
            </div>
          )}

          {/* Fix error message */}
          {fixError && (
            <div className="mt-2 text-xs text-orange-400">
              ⚠️ {fixError}
            </div>
          )}
        </div>

        {/* Stack trace */}
        {error.stack && (
          <div className="border-t border-red-900/30 px-4 py-3 max-h-48 overflow-auto">
            <div className="text-[10px] text-red-400/50 uppercase tracking-wider mb-1">
              Trace de la pile
            </div>
            <pre className="text-xs text-red-300/80 whitespace-pre-wrap font-mono leading-relaxed">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
