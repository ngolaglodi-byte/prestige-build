"use client";

import React from "react";

interface ImportProgressProps {
  current: number;
  total: number;
  label?: string;
}

export default function ImportProgress({ current, total, label }: ImportProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="max-w-md mx-auto space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label ?? "Import en cours…"}</span>
        <span className="text-[var(--muted)]">
          {current}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-[var(--surface)]">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
