"use client";

import { useState, useRef, useEffect } from "react";
import { useAiPanel } from "@/lib/store/aiPanel";
import { useTabs } from "@/lib/store/tabs";
import { useAiDiff } from "@/lib/store/aiDiffStore";
import { useAIMultiPreviewStore } from "@/store/useAIMultiPreviewStore"; // IMPORTANT
import { useLogsStore } from "@/lib/store/logsStore";

import { DiffItem } from "@/lib/store/aiDiffStore";
import { MultiPreviewItem } from "@/store/useAIMultiPreviewStore";

type AIAction = "generate" | "generate_multi" | "refactor" | "explain" | "fix" | "create_project";

const AI_ACTIONS: { key: AIAction; label: string; icon: string }[] = [
  { key: "generate", label: "Générer fichier", icon: "✨" },
  { key: "generate_multi", label: "Générer multi-fichiers", icon: "📦" },
  { key: "refactor", label: "Refactoriser", icon: "🔧" },
  { key: "explain", label: "Expliquer le code", icon: "💡" },
  { key: "fix", label: "Corriger les erreurs", icon: "🩹" },
  { key: "create_project", label: "Créer un projet", icon: "🚀" },
];

export function AiPanel({ projectId }: { projectId: string }) {
  const { messages, loading, sendPrompt } = useAiPanel();
  const { activeFile } = useTabs();
  const { showDiffs } = useAiDiff();
  const showMultiPreview = useAIMultiPreviewStore((s) => s.showPreviews);
  const { addAiLog } = useLogsStore();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAction = (action: AIAction) => {
    const prompts: Record<AIAction, string> = {
      generate: activeFile
        ? `Génère un nouveau fichier similaire à ${activeFile}`
        : "Génère un nouveau fichier pour ce projet",
      generate_multi: "Génère plusieurs fichiers pour ce projet",
      refactor: activeFile
        ? `Refactorise le fichier ${activeFile}`
        : "Refactorise le code du projet",
      explain: activeFile
        ? `Explique le code du fichier ${activeFile}`
        : "Explique l'architecture de ce projet",
      fix: activeFile
        ? `Corrige les erreurs dans le fichier ${activeFile}`
        : "Corrige les erreurs dans ce projet",
      create_project:
        "Crée la structure complète d'un projet (précisez le type : nextjs, react, vue, svelte, astro, react-native, electron, tauri, fastapi, go, dashboard, ecommerce, game, template)",
    };

    setInput(prompts[action]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addAiLog(`Requête : ${input.trim()}`);

    // Récupérer la réponse AI
    const res = await sendPrompt(projectId, input, activeFile ?? undefined);

    // Diff simple (un seul fichier)
    if (res?.diffs) {
      showDiffs(res.diffs as DiffItem[]);
      addAiLog("Modifications suggérées reçues");
    }

    // Multi‑file preview
    if (res?.previews) {
      showMultiPreview(res.previews as MultiPreviewItem[]);
      addAiLog(`Aperçu multi-fichiers : ${(res.previews as MultiPreviewItem[]).length} fichiers`);
    }

    // Avertissements de sécurité
    if (res?.safetyWarnings) {
      const warnings = res.safetyWarnings as string[];
      for (const w of warnings) {
        addAiLog(`⚠️ ${w}`);
      }
    }

    if (res?.message) {
      addAiLog(`Réponse IA reçue`);
    }

    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
        Panneau IA
      </div>

      {/* Actions rapides */}
      <div className="px-3 py-2 border-b border-white/10 flex flex-wrap gap-1">
        {AI_ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.key)}
            disabled={loading}
            className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-300 disabled:opacity-50 flex items-center gap-1"
            title={action.label}
          >
            <span>{action.icon}</span>
            <span className="hidden xl:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <div className="text-gray-500 text-xs">
            Posez une question sur votre code, vos fichiers ou l&apos;architecture.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "text-blue-300"
                : "text-gray-200 bg-white/5 rounded p-2"
            }
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 fade-in">
            <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            L&apos;IA réfléchit…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-2 border-t border-white/10">
        <textarea
          className="w-full bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-sm text-gray-100 resize-none h-16"
          placeholder={
            activeFile
              ? `Demandez à l'IA à propos de ${activeFile}…`
              : "Posez une question sur votre projet…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex justify-end mt-1">
          <button
            type="submit"
            disabled={loading}
            className="text-xs px-3 py-1 rounded bg-accent text-black disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
