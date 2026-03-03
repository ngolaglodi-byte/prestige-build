"use client";

import { create } from "zustand";

export interface AIPreviewItem {
  file: string;
  newContent: string;
}

interface AIPreviewStore {
  preview: AIPreviewItem | null;
  setPreview: (p: AIPreviewItem) => void;
  clearPreview: () => void;
}

export const useAIPreviewStore = create<AIPreviewStore>((set) => ({
  preview: null,
  setPreview: (p) => set({ preview: p }),
  clearPreview: () => set({ preview: null }),
}));