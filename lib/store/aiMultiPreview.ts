import { create } from "zustand";

export type AIPreviewFile = {
  path: string;
  oldContent: string;
  newContent: string;
};

export const useAiMultiPreview = create((set) => ({
  files: [] as AIPreviewFile[],
  visible: false,

  showPreview: (files: AIPreviewFile[]) =>
    set({ files, visible: true }),

  hidePreview: () =>
    set({ files: [], visible: false }),
}));
