"use client";

import React, { useState } from "react";

interface GeneratedFile {
  path: string;
  content: string;
}

interface GenerationPanelProps {
  files: GeneratedFile[];
  onSelectFile?: (file: GeneratedFile) => void;
}

export default function GenerationPanel({ files, onSelectFile }: GenerationPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (files.length === 0) {
    return (
      <div className="p-4 text-[var(--muted)] text-sm">
        Aucun fichier généré pour le moment.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <h3 className="px-4 py-3 text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)]">
        Fichiers générés ({files.length})
      </h3>
      <ul className="divide-y divide-[var(--border)]">
        {files.map((file) => (
          <li key={file.path}>
            <button
              onClick={() => {
                setExpanded(expanded === file.path ? null : file.path);
                onSelectFile?.(file);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--surface-light)] transition-colors flex items-center justify-between"
            >
              <span className="text-accent font-mono truncate">{file.path}</span>
              <span className="text-[var(--muted)] text-xs ml-2">
                {expanded === file.path ? "▲" : "▼"}
              </span>
            </button>
            {expanded === file.path && (
              <pre className="px-4 py-2 text-xs bg-[var(--editor)] text-[var(--foreground)] overflow-x-auto max-h-64">
                <code>{file.content}</code>
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
