"use client";

import React from "react";
import type { CanvasNode } from "@/lib/editor/drag-drop-engine";
import { getComponentById } from "@/lib/editor/component-registry";

interface PropertyPanelProps {
  node: CanvasNode | null;
  onUpdate: (nodeId: string, updates: { props?: Record<string, unknown>; classes?: string }) => void;
  onDelete: (nodeId: string) => void;
}

export default function PropertyPanel({ node, onUpdate, onDelete }: PropertyPanelProps) {
  if (!node) {
    return (
      <div className="p-4 text-sm text-[var(--muted)]">
        Sélectionnez un composant pour modifier ses propriétés.
      </div>
    );
  }

  const def = getComponentById(node.componentId);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <h3 className="px-4 py-3 text-sm font-semibold border-b border-[var(--border)]">
        {def?.label ?? node.componentId}
      </h3>

      <div className="p-4 space-y-4">
        {/* Text property */}
        {typeof node.props.text === "string" && (
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Texte</span>
            <input
              type="text"
              value={String(node.props.text)}
              onChange={(e) =>
                onUpdate(node.id, { props: { text: e.target.value } })
              }
              className="mt-1 w-full px-3 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--surface)]"
            />
          </label>
        )}

        {/* Placeholder property */}
        {typeof node.props.placeholder === "string" && (
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Placeholder</span>
            <input
              type="text"
              value={String(node.props.placeholder)}
              onChange={(e) =>
                onUpdate(node.id, { props: { placeholder: e.target.value } })
              }
              className="mt-1 w-full px-3 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--surface)]"
            />
          </label>
        )}

        {/* Classes */}
        <label className="block">
          <span className="text-xs text-[var(--muted)]">Classes Tailwind</span>
          <input
            type="text"
            value={node.classes}
            onChange={(e) => onUpdate(node.id, { classes: e.target.value })}
            className="mt-1 w-full px-3 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--surface)] font-mono"
          />
        </label>

        {/* Delete */}
        <button
          onClick={() => onDelete(node.id)}
          className="w-full py-2 text-sm text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
        >
          Supprimer le composant
        </button>
      </div>
    </div>
  );
}
