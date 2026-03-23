"use client";

import { create } from "zustand";

interface EditorStore {
  content: string;
  path: string | null;
  loading: boolean;
  loadFile: (projectId: string, path: string) => Promise<void>;
  updateContent: (value: string | undefined) => void;
  saveFile: (projectId: string) => Promise<void>;
}

export const useEditor = create<EditorStore>((set, get) => ({
  content: "",
  path: null,
  loading: false,

  loadFile: async (projectId: string, path: string) => {
    if (!projectId || !path) {
      console.error("[Editor] loadFile called with invalid params:", { projectId, path });
      return;
    }

    console.log("[Editor] Loading file:", path, "from project:", projectId);
    set({ loading: true });

    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      
      if (!res.ok) {
        console.error("[Editor] Failed to fetch files:", res.status);
        set({ loading: false });
        return;
      }
      
      const data = await res.json();
      const file = data.files?.find((f: { path: string; content: string }) => f.path === path);

      console.log("[Editor] File loaded:", !!file);
      set({
        content: file?.content || "",
        path,
        loading: false,
      });
    } catch (err) {
      console.error("[Editor] Error loading file:", err);
      set({ loading: false });
    }
  },

  updateContent: (value: string | undefined) => set({ content: value ?? "" }),

  saveFile: async (projectId: string) => {
    const { path, content } = get();
    if (!path || !projectId) {
      console.warn("[Editor] saveFile skipped: missing path or projectId");
      return;
    }

    console.log("[Editor] Saving file:", path);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      
      if (!res.ok) {
        console.error("[Editor] Failed to save file:", res.status);
      } else {
        console.log("[Editor] File saved successfully");
      }
    } catch (err) {
      console.error("[Editor] Error saving file:", err);
    }
  },
}));
