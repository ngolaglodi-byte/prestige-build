"use client";

import { useTabs } from "@/lib/store/tabs";

export function Tabs() {
  const { openFiles, activeFile, selectTab, closeTab } = useTabs();

  if (openFiles.length === 0) {
    return (
      <div className="h-8 border-b border-white/10 flex items-center px-3 text-gray-500 text-sm">
        Aucun fichier ouvert
      </div>
    );
  }

  return (
    <div className="h-8 border-b border-white/10 flex items-center gap-1 px-2 bg-[#1a1a1a]">
      {openFiles.map((file) => (
        <div
          key={file}
          className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer text-sm
            ${
              activeFile === file
                ? "bg-accent text-black"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]"
            }
          `}
          onClick={() => selectTab(file)}
        >
          <span>{file.split("/").pop()}</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(file);
            }}
            className="text-xs text-gray-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
