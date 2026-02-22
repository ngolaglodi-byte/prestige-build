import { create } from "zustand";

interface TabsStore {
  openFiles: string[];
  activeFile: string | null;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  selectTab: (path: string) => void;
}

export const useTabs = create<TabsStore>((set, get) => ({
  openFiles: [],
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
