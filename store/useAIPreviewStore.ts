"use client";

import { create } from "zustand";

interface PreviewData {
  file: string;
  newContent: string;
}

interface AIPreviewStore {
  preview: PreviewData | null;
  setPreview: (p: PreviewData) => void;
  clearPreview: () => void;
}

export const useAIPreviewStore = create<AIPreviewStore>((set) => ({
  preview: null,

  setPreview: (p) => set({ preview: p }),

  clearPreview: () => set({ preview: null }),
}));
