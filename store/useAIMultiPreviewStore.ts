"use client";

import { create } from "zustand";

export interface MultiPreviewItem {
  file: string;
  newContent: string;
}

interface AIMultiPreviewStore {
  previews: MultiPreviewItem[];
  setPreviews: (p: MultiPreviewItem[]) => void;
  clearPreviews: () => void;
}

export const useAIMultiPreviewStore = create<AIMultiPreviewStore>((set) => ({
  previews: [],

  setPreviews: (p) => set({ previews: p }),

  clearPreviews: () => set({ previews: [] }),
}));
