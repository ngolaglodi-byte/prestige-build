"use client";

import React, { useState } from "react";

interface FigmaPage {
  id: string;
  name: string;
  childCount: number;
}

interface ImportPreviewProps {
  fileName: string;
  pages: FigmaPage[];
  tree: unknown[];
  onImport: (selectedPageIds: string[]) => void;
  loading?: boolean;
}

export default function ImportPreview({
  fileName,
  pages,
  tree,
  onImport,
  loading,
}: ImportPreviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(pages.map((p) => p.id))
  );

  const togglePage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-semibold">Import : {fileName}</h2>
      <p className="text-sm text-[var(--muted)]">
        {pages.length} page(s) trouvée(s), {tree.length} nœud(s) racine.
      </p>

      <ul className="space-y-2">
        {pages.map((page) => (
          <li
            key={page.id}
            className="flex items-center gap-3 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(page.id)}
              onChange={() => togglePage(page.id)}
              className="accent-[#6366F1]"
            />
            <div>
              <p className="text-sm font-medium">{page.name}</p>
              <p className="text-xs text-[var(--muted)]">{page.childCount} éléments</p>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onImport(Array.from(selectedIds))}
        disabled={selectedIds.size === 0 || loading}
        className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accentDark disabled:opacity-50 transition-colors"
      >
        {loading ? "Import en cours…" : `Importer ${selectedIds.size} page(s)`}
      </button>
    </div>
  );
}
