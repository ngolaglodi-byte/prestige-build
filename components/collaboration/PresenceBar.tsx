"use client";

import React from "react";

interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  page?: string;
}

interface PresenceBarProps {
  users: PresenceUser[];
}

export default function PresenceBar({ users }: PresenceBarProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
      <span className="text-xs text-[var(--muted)] mr-2">En ligne :</span>
      {users.map((user) => (
        <div
          key={user.userId}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
          style={{ backgroundColor: user.color }}
          title={`${user.name} — ${user.page ?? "/"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          {user.name}
        </div>
      ))}
    </div>
  );
}
