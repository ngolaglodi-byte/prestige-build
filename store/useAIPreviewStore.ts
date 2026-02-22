"use client";

import { create } from "zustand";

interface AICodePreview {
  file: string;
  newContent: string;
}

interface AIPreviewStore {
  preview: AICodePreview | null;
  setPreview: (preview: AICodePreview) => void;
  clearPreview: () => void;
}

export const useAIPreviewStore = create<AIPreviewStore>((set) => ({
  preview: null,
  setPreview: (preview) => set({ preview }),
  clearPreview: () => set({ preview: null }),
}));
