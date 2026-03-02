"use client";

import React from "react";
import type { CanvasNode } from "@/lib/editor/drag-drop-engine";
import { getComponentById } from "@/lib/editor/component-registry";

interface CanvasProps {
  tree: CanvasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (componentId: string, parentId: string | null) => void;
}

function RenderNode({
  node,
  selectedId,
  onSelect,
}: {
  node: CanvasNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const def = getComponentById(node.componentId);
  const isSelected = selectedId === node.id;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={`relative cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-accent ring-offset-1 ring-offset-[var(--bg)]" : "hover:ring-1 hover:ring-[var(--border)]"
      } ${node.classes || def?.defaultClasses || ""}`}
    >
      {/* Label badge */}
      {isSelected && (
        <span className="absolute -top-5 left-0 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded">
          {def?.label ?? node.componentId}
        </span>
      )}

      {/* Text or self-closing content */}
      {typeof node.props.text === "string" && node.props.text}
      {node.componentId === "image" && (
        <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] text-xs">
          🖼 Image
        </div>
      )}
      {node.componentId === "text-input" && (
        <input
          readOnly
          aria-label={String(node.props.placeholder ?? "Champ texte")}
          placeholder={String(node.props.placeholder ?? "Saisir…")}
          className={node.classes || def?.defaultClasses || ""}
        />
      )}

      {/* Children */}
      {node.children.map((child) => (
        <RenderNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default function Canvas({ tree, selectedId, onSelect, onDrop }: CanvasProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentId = e.dataTransfer.getData("componentId");
    if (componentId) {
      onDrop(componentId, null);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex-1 min-h-full p-6 bg-[var(--editor)] overflow-auto"
    >
      {tree.length === 0 && (
        <div className="flex items-center justify-center h-full text-[var(--muted)] text-sm">
          Glissez des composants ici pour construire votre page
        </div>
      )}
      {tree.map((node) => (
        <RenderNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
