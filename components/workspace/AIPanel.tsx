"use client";

import { useState, useRef, useEffect } from "react";
import { useAiPanel } from "@/lib/store/aiPanel";
import { useTabs } from "@/lib/store/tabs";
import { useAiDiff } from "@/lib/store/aiDiffStore";
import { useAIMultiPreviewStore } from "@/store/useAIMultiPreviewStore"; // IMPORTANT

export function AiPanel({ projectId }: { projectId: string }) {
  const { messages, loading, sendPrompt } = useAiPanel();
  const { activeFile } = useTabs();
  const { showDiffs } = useAiDiff();
  const showMultiPreview = useAIMultiPreviewStore((s) => s.showPreviews);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Récupérer la réponse AI
    const res = await sendPrompt(projectId, input, activeFile);

    // Diff simple (un seul fichier)
    if (res?.diffs) {
      showDiffs(res.diffs);
    }

    // Multi‑file preview
    if (res?.previews) {
      showMultiPreview(res.previews);
    }

    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
        AI Panel
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <div className="text-gray-500 text-xs">
            Ask AI about your code, files, or architecture.
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
          <div className="text-xs text-gray-500">AI is thinking...</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-2 border-t border-white/10">
        <textarea
          className="w-full bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-sm text-gray-100 resize-none h-16"
          placeholder={
            activeFile
              ? `Ask AI about ${activeFile}...`
              : "Ask AI about your project..."
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
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
