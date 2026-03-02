"use client";

import React from "react";

interface TopToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onPreview: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function TopToolbar({
  onUndo,
  onRedo,
  onSave,
  onExport,
  onPreview,
  canUndo,
  canRedo,
}: TopToolbarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">🎨 Éditeur visuel</span>
      </div>
      <div className="flex items-center gap-1">
        <ToolBtn label="↩" title="Annuler" onClick={onUndo} disabled={!canUndo} />
        <ToolBtn label="↪" title="Rétablir" onClick={onRedo} disabled={!canRedo} />
        <Divider />
        <ToolBtn label="💾" title="Sauvegarder" onClick={onSave} />
        <ToolBtn label="📤" title="Exporter" onClick={onExport} />
        <Divider />
        <button
          onClick={onPreview}
          className="px-3 py-1.5 text-xs bg-accent text-white rounded-md hover:bg-accentDark transition-colors"
        >
          Prévisualiser
        </button>
      </div>
    </header>
  );
}

function ToolBtn({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-2 py-1 text-sm rounded hover:bg-[var(--surface-light)] disabled:opacity-30 transition-colors"
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-[var(--border)] mx-1" />;
}
