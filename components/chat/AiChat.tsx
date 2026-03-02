"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, User, Send, Loader2, Code2, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExtractedFile {
  path: string;
  content: string;
  language: string;
}

interface Props {
  projectId?: string;
  context?: string;
  onFilesGenerated?: (files: ExtractedFile[]) => void;
}

const SUGGESTIONS = [
  "Crée un composant bouton réutilisable",
  "Génère un formulaire de connexion",
  "Crée une page d'accueil moderne",
  "Génère une navbar responsive",
];

function extractFilesFromContent(content: string): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  const regex = /```(\w+)?\s+path="([^"]+)"([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    files.push({
      language: match[1] ?? "tsx",
      path: match[2],
      content: match[3].trim(),
    });
  }
  return files;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const files = !isUser ? extractFilesFromContent(message.content) : [];

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-purple-600" : "bg-gray-700"
        }`}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-purple-400" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-purple-600 text-white rounded-tr-sm"
              : "bg-gray-800 text-gray-100 rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>
        {files.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-400"
              >
                <Code2 size={12} className="text-purple-400 flex-shrink-0" />
                <span className="font-mono truncate">{f.path}</span>
                <span className="ml-auto text-gray-600">{f.language}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AiChat({ projectId, context, onFilesGenerated }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: text.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setError(null);
      setIsLoading(true);
      setStreamingContent("");

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            projectId,
            context,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
          throw new Error(err.error ?? `Erreur HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Pas de flux de réponse");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamingContent(accumulated);
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: accumulated,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");

        // Extract and report generated files
        const files = extractFilesFromContent(accumulated);
        if (files.length > 0 && onFilesGenerated) {
          onFilesGenerated(files);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, projectId, context, onFilesGenerated]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
          <Bot size={18} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-100">Assistant IA</p>
          <p className="text-xs text-gray-500">Décrivez ce que vous voulez créer</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center">
              <Bot size={32} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-300 font-medium">Comment puis-je vous aider ?</p>
              <p className="text-gray-600 text-sm mt-1">Décrivez votre projet ou choisissez une suggestion</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 text-left transition-colors"
                >
                  <ChevronRight size={12} className="text-purple-400 flex-shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && streamingContent && (
          <MessageBubble
            message={{ role: "assistant", content: streamingContent }}
          />
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-purple-400" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-purple-400 animate-spin" />
              <span className="text-sm text-gray-400">Génération en cours…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-900/20 border border-red-800 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2 items-end bg-gray-800 border border-gray-700 rounded-xl p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre composant ou posez une question… (Entrée pour envoyer)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none text-sm text-gray-100 placeholder-gray-600 outline-none min-h-[20px] max-h-[120px] py-1 px-1"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1 text-center">
          Maj+Entrée pour un saut de ligne
        </p>
      </div>
    </div>
  );
}

export default AiChat;
