import { create } from "zustand";

export const useWorkspaceStore = create((set) => ({
  files: {},
  updateFile: (path, content) =>
    set((state) => ({
      files: {
        ...state.files,
        [path]: { ...state.files[path], content },
      },
    })),
}));
