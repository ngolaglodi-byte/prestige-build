"use client";

import React, { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string) => void;
  shareLink?: string;
}

export default function ShareDialog({ open, onClose, onInvite, shareLink }: ShareDialogProps) {
  const [email, setEmail] = useState("");

  if (!open) return null;

  const handleInvite = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    onInvite(trimmed);
    setEmail("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 animate-scaleIn">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Partager le projet</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">
            ✕
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleInvite}
            disabled={!email.trim()}
            className="px-4 py-2 bg-accent text-white text-sm rounded-lg font-medium hover:bg-accentDark disabled:opacity-50 transition-colors"
          >
            Inviter
          </button>
        </div>

        {shareLink && (
          <div className="space-y-1">
            <p className="text-xs text-[var(--muted)]">Ou partagez ce lien :</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded border border-[var(--border)] bg-[var(--bg)]"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--surface-light)] transition-colors"
              >
                Copier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
