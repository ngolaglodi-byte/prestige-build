"use client";

import React from "react";
import type { EditorPage } from "@/lib/editor/page-manager";

interface PageNavigatorProps {
  pages: EditorPage[];
  activePageId: string;
  onSelect: (pageId: string) => void;
  onAdd: () => void;
  onDelete: (pageId: string) => void;
}

export default function PageNavigator({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onDelete,
}: PageNavigatorProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] overflow-x-auto">
      {pages.map((page) => (
        <button
          key={page.id}
          onClick={() => onSelect(page.id)}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
            page.id === activePageId
              ? "bg-accent text-white"
              : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-light)]"
          }`}
        >
          {page.name}
          {pages.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete(page.id);
              }}
              className="ml-1 opacity-60 hover:opacity-100"
            >
              ×
            </span>
          )}
        </button>
      ))}
      <button
        onClick={onAdd}
        className="px-2 py-1.5 text-xs text-[var(--muted)] hover:text-accent transition-colors"
      >
        + Page
      </button>
    </div>
  );
}
