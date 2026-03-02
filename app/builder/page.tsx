"use client";

import React, { useState, useCallback } from "react";
import ChatInterface, { type ChatMessage } from "./components/ChatInterface";
import CodePreview from "./components/CodePreview";
import GenerationPanel from "./components/GenerationPanel";
import PromptSuggestions from "./components/PromptSuggestions";

interface GeneratedFile {
  path: string;
  content: string;
}

export default function BuilderPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSend = useCallback(
    async (message: string) => {
      setShowSuggestions(false);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const isIteration = files.length > 0;
        const endpoint = isIteration ? "/api/builder/iterate" : "/api/builder/generate";
        const payload = isIteration
          ? { message, files, history: messages.map((m) => ({ role: m.role, content: m.content })) }
          : { message, history: messages.map((m) => ({ role: m.role, content: m.content })) };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);

          // Build a simple preview from the first page or component
          const pageFile = data.files.find(
            (f: GeneratedFile) => f.path.includes("page.tsx") || f.path.includes("Page.tsx")
          );
          if (pageFile) {
            setPreviewHtml(
              `<div style="padding:2rem;font-family:system-ui,sans-serif;color:#e5e7eb">
                <pre style="white-space:pre-wrap;font-size:0.75rem">${escapeHtml(pageFile.content)}</pre>
              </div>`
            );
          }
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.files?.length
            ? `✅ ${data.files.length} fichier(s) généré(s). Consultez le panneau de droite pour voir le code.`
            : data.error ?? "Aucun fichier généré.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "❌ Une erreur est survenue lors de la génération.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [files, messages]
  );

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--foreground)]">
      {/* Left – Chat */}
      <div className="w-1/3 min-w-[320px] border-r border-[var(--border)] flex flex-col">
        <header className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <span className="text-lg font-semibold">🚀 Builder</span>
          <span className="text-xs text-[var(--muted)]">Chat-to-App</span>
        </header>
        {showSuggestions && messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center">
            <PromptSuggestions onSelect={handleSend} />
          </div>
        ) : (
          <ChatInterface onSend={handleSend} messages={messages} loading={loading} />
        )}
      </div>

      {/* Center – Preview */}
      <div className="flex-1 flex flex-col border-r border-[var(--border)]">
        <header className="px-4 py-3 border-b border-[var(--border)] text-sm font-medium">
          Prévisualisation
        </header>
        <div className="flex-1">
          <CodePreview html={previewHtml} />
        </div>
      </div>

      {/* Right – Generated files */}
      <div className="w-1/4 min-w-[260px]">
        <GenerationPanel files={files} />
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
