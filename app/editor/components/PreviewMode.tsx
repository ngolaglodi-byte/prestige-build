"use client";

import React from "react";

interface PreviewModeProps {
  code: string;
  onClose: () => void;
}

export default function PreviewMode({ code, onClose }: PreviewModeProps) {
  const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>body { background: #0d0d0d; color: #e5e7eb; font-family: system-ui, sans-serif; }</style>
</head>
<body>
  <div id="root"><pre style="padding:2rem;font-size:0.75rem;white-space:pre-wrap">${escapeHtml(code)}</pre></div>
</body>
</html>`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <span className="text-sm font-medium">Prévisualisation</span>
        <button
          onClick={onClose}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ✕ Fermer
        </button>
      </header>
      <iframe
        srcDoc={html}
        title="Preview"
        className="flex-1 w-full border-0"
        sandbox="allow-scripts"
      />
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
