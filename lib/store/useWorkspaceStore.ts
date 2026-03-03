"use client";

import { create } from "zustand";

export interface WorkspaceFile {
  content: string;
}

interface WorkspaceStore {
  files: Record<string, WorkspaceFile>;
  updateFile: (path: string, content: string) => void;
  setFiles: (files: Record<string, WorkspaceFile>) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  files: {},

  updateFile: (path, content) =>
    set((state) => ({
      files: { ...state.files, [path]: { content } },
    })),

  setFiles: (files) => set({ files }),
}));
