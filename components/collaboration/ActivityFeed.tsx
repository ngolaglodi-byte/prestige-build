"use client";

import React from "react";

interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: number;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="p-3 text-xs text-[var(--muted)]">
        Aucune activité récente.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--border)]">
      {entries.map((entry) => (
        <div key={entry.id} className="px-3 py-2 text-xs">
          <span className="font-medium text-accent">{entry.user}</span>{" "}
          <span className="text-[var(--muted)]">{entry.action}</span>{" "}
          <span className="text-[var(--foreground)]">{entry.target}</span>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            {new Date(entry.timestamp).toLocaleString("fr-FR")}
          </p>
        </div>
      ))}
    </div>
  );
}
