import { create } from "zustand";

export const useAiDiff = create((set) => ({
  diffs: [] as { path: string; diff: string }[],
  visible: false,

  showDiffs: (diffs) => set({ diffs, visible: true }),
  hideDiffs: () => set({ visible: false, diffs: [] }),
}));
