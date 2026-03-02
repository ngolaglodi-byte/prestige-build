"use client";

// components/collab/RemoteCursors.tsx
// Overlay for Monaco Editor that renders remote collaborator cursors and labels.
// Labels fade out after 3 seconds of inactivity but the cursor line stays.

import { useEffect, useRef, useState } from "react";
import type { RemoteCursor } from "@/hooks/useCollaboration";

interface Props {
  cursors: RemoteCursor[];
  currentFileId?: string;
}

export function RemoteCursors({ cursors, currentFileId }: Props) {
  // Track last-updated timestamp per cursor to hide labels after 3s
  const lastUpdate = useRef<Record<string, number>>({});
  const [visibleLabels, setVisibleLabels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const now = Date.now();
    for (const c of cursors) {
      const prev = lastUpdate.current[c.userId];
      if (!prev || prev !== c.line * 10000 + c.column) {
        lastUpdate.current[c.userId] = c.line * 10000 + c.column;
        setVisibleLabels((v) => ({ ...v, [c.userId]: true }));
      }
    }

    const timer = setTimeout(() => {
      setVisibleLabels((v) => {
        const next = { ...v };
        for (const key of Object.keys(next)) {
          next[key] = false;
        }
        return next;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [cursors]);

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
          {/* Name tag — fades after 3s of inactivity */}
          <div
            className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-medium text-white rounded whitespace-nowrap shadow-md transition-opacity duration-300"
            style={{
              backgroundColor: cursor.color,
              opacity: visibleLabels[cursor.userId] ? 1 : 0,
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RemoteCursors;
