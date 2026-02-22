import { create } from "zustand";

interface AiDiff {
  path: string;
  diff: string;
}

interface AiDiffStore {
  diffs: AiDiff[];
  visible: boolean;
  showDiffs: (diffs: AiDiff[]) => void;
  hideDiffs: () => void;
}

export const useAiDiff = create<AiDiffStore>((set) => ({
  diffs: [],
  visible: false,

  showDiffs: (diffs) => set({ diffs, visible: true }),
  hideDiffs: () => set({ visible: false, diffs: [] }),
}));
