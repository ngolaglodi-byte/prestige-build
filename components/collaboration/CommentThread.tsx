"use client";

import React, { useState } from "react";

interface ThreadComment {
  id: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: number;
  resolved: boolean;
}

interface CommentThreadProps {
  comments: ThreadComment[];
  onAdd: (content: string) => void;
  onResolve: (commentId: string) => void;
}

export default function CommentThread({ comments, onAdd, onResolve }: CommentThreadProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {comments.length === 0 && (
        <p className="text-xs text-[var(--muted)]">Aucun commentaire.</p>
      )}
      {comments.map((c) => (
        <div
          key={c.id}
          className={`text-xs p-2 rounded-md ${
            c.resolved ? "opacity-50 line-through" : "bg-[var(--editor)]"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-accent">{c.authorName}</span>
            {!c.resolved && (
              <button
                onClick={() => onResolve(c.id)}
                className="text-[10px] text-[var(--muted)] hover:text-green-400"
              >
                ✓ Résoudre
              </button>
            )}
          </div>
          <p>{c.content}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-1 mt-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ajouter un commentaire…"
          className="flex-1 text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg)]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-2 py-1 text-xs bg-accent text-white rounded disabled:opacity-50"
        >
          →
        </button>
      </form>
    </div>
  );
}
