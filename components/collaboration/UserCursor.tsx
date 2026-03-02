"use client";

import React from "react";

interface UserCursorProps {
  name: string;
  color: string;
  x: number;
  y: number;
}

export default function UserCursor({ name, color, x, y }: UserCursorProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 transition-all duration-100"
      style={{ left: x, top: y }}
    >
      {/* Cursor arrow */}
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
        <path
          d="M0 0L16 12H6L3 20L0 0Z"
          fill={color}
        />
      </svg>
      {/* Name label */}
      <span
        className="absolute left-4 top-3 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}
