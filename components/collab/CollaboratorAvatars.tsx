"use client";

// components/collab/CollaboratorAvatars.tsx
// Displays stacked avatar circles for each connected collaborator (GitHub/Figma style).

import { useState } from "react";
import { useCollaboration } from "@/hooks/useCollaboration";

const MAX_VISIBLE = 4;

interface Props {
  projectId: string;
  userId: string;
  userName: string;
}

export function CollaboratorAvatars({ projectId, userId, userName }: Props) {
  const { collaborators } = useCollaboration({ projectId, userId, userName });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (collaborators.length === 0) return null;

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - MAX_VISIBLE;

  return (
    <div className="flex items-center">
      {visible.map((c, i) => (
        <div
          key={c.id}
          className="relative"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: MAX_VISIBLE - i }}
          onMouseEnter={() => setHoveredId(c.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[var(--bg,#0d0d0d)] cursor-default transition-transform duration-150 hover:scale-110"
            style={{ backgroundColor: c.color }}
          >
            {c.name.charAt(0).toUpperCase()}
          </div>
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-1 ring-[var(--bg,#0d0d0d)]" />
          {/* Tooltip */}
          {hoveredId === c.id && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-medium text-white bg-gray-800 whitespace-nowrap shadow-md z-50">
              {c.name}
              {c.fileId ? ` — ${c.fileId}` : ""}
            </div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[var(--muted,#555)] ring-2 ring-[var(--bg,#0d0d0d)] cursor-default"
          style={{ marginLeft: -8, zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default CollaboratorAvatars;
