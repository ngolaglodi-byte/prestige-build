"use client";

import { create } from "zustand";

interface FileEntry {
  content: string;
}

interface WorkspaceStore {
  files: Record<string, FileEntry>;
  setFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  removeFile: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  files: {},

  setFile: (path, content) =>
    set((state) => ({
      files: { ...state.files, [path]: { content } },
    })),

  updateFile: (path, content) =>
    set((state) => ({
      files: { ...state.files, [path]: { content } },
    })),

  removeFile: (path) =>
    set((state) => {
      const files = { ...state.files };
      delete files[path];
      return { files };
    }),
}));

