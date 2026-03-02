"use client";

// components/collab/RemoteCursors.tsx
// Overlay for Monaco Editor that renders remote collaborator cursors and labels.

import type { RemoteCursor } from "@/hooks/useCollaboration";

interface Props {
  cursors: RemoteCursor[];
  currentFileId?: string;
}

export function RemoteCursors({ cursors, currentFileId }: Props) {
  // Only show cursors for the file the user is currently viewing
  const visible = cursors.filter(
    (c) => !currentFileId || !c.fileId || c.fileId === currentFileId
  );

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {visible.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-150 ease-out"
          style={{
            top: `${cursor.line * 19}px`, // ~19px per line in Monaco
            left: `${cursor.column * 7.8}px`, // ~7.8px per char
          }}
        >
          {/* Cursor line */}
          <div
            className="w-0.5 h-5 rounded-full"
            style={{ backgroundColor: cursor.color }}
          />
          {/* Name tag */}
          <div
            className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-medium text-white rounded whitespace-nowrap shadow-md"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RemoteCursors;
