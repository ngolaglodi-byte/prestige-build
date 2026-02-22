import { create } from "zustand";

export interface DiffItem {
  path: string;
  diff: string;
}

interface AiDiffStore {
  diffs: DiffItem[];
  visible: boolean;
  showDiffs: (diffs: DiffItem[]) => void;
  hideDiffs: () => void;
}

export const useAiDiff = create<AiDiffStore>((set) => ({
  diffs: [],
  visible: false,

  showDiffs: (diffs: DiffItem[]) => set({ diffs, visible: true }),
  hideDiffs: () => set({ visible: false, diffs: [] }),
}));
