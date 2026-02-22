import { create } from "zustand";

export const useTabs = create((set, get) => ({
  openFiles: [],       // ["src/app/page.tsx", "package.json"]
  activeFile: null,

  openTab: (path) => {
    const { openFiles } = get();

    if (!openFiles.includes(path)) {
      set({ openFiles: [...openFiles, path] });
    }

    set({ activeFile: path });
  },

  closeTab: (path) => {
    const { openFiles, activeFile } = get();

    const newTabs = openFiles.filter((f) => f !== path);

    set({ openFiles: newTabs });

    if (activeFile === path) {
      set({ activeFile: newTabs[newTabs.length - 1] || null });
    }
  },

  selectTab: (path) => set({ activeFile: path }),
}));
