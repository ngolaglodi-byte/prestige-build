"use client";

import React from "react";
import {
  COMPONENT_REGISTRY,
  type ComponentDef,
} from "@/lib/editor/component-registry";

const CATEGORIES: { key: ComponentDef["category"]; label: string }[] = [
  { key: "layout", label: "Mise en page" },
  { key: "display", label: "Affichage" },
  { key: "input", label: "Entrées" },
  { key: "navigation", label: "Navigation" },
];

export default function ComponentLibrary() {
  const handleDragStart = (e: React.DragEvent, componentId: string) => {
    e.dataTransfer.setData("componentId", componentId);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <h3 className="px-4 py-3 text-sm font-semibold border-b border-[var(--border)]">
        Composants
      </h3>
      {CATEGORIES.map((cat) => {
        const items = COMPONENT_REGISTRY.filter((c) => c.category === cat.key);
        return (
          <div key={cat.key}>
            <p className="px-4 pt-3 pb-1 text-xs text-[var(--muted)] uppercase tracking-wide">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-1 px-3 pb-2">
              {items.map((comp) => (
                <div
                  key={comp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, comp.id)}
                  className="cursor-grab active:cursor-grabbing px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] hover:border-accent transition-colors text-center"
                >
                  {comp.label}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
