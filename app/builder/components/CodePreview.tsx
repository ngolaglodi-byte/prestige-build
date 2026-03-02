"use client";

import React from "react";

interface CodePreviewProps {
  html: string;
}

export default function CodePreview({ html }: CodePreviewProps) {
  if (!html) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--muted)] text-sm">
        La prévisualisation apparaîtra ici après la génération.
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Preview"
      className="w-full h-full border-0 rounded-lg bg-white"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
