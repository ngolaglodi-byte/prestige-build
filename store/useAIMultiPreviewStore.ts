"use client";

import { create } from "zustand";

export interface MultiPreviewItem {
  file: string;
  newContent: string;
}

interface AIMultiPreviewStore {
  previews: MultiPreviewItem[];
  showPreviews: (p: MultiPreviewItem[]) => void;
  clearPreviews: () => void;
}

export const useAIMultiPreviewStore = create<AIMultiPreviewStore>((set) => ({
  previews: [],

  showPreviews: (p) => set({ previews: p }),

  clearPreviews: () => set({ previews: [] }),
}));
