import { create } from "zustand";

interface EditorStore {
  content: string;
  path: string | null;
  loading: boolean;
  loadFile: (projectId: string, path: string) => Promise<void>;
  updateContent: (value: string | undefined) => void;
  saveFile: (projectId: string) => Promise<void>;
}

export const useEditor = create<EditorStore>((set, get) => ({
  content: "",
  path: null,
  loading: false,

  loadFile: async (projectId: string, path: string) => {
    set({ loading: true });

    const res = await fetch(`/api/projects/${projectId}/files`);
    const data = await res.json();

    const file = data.files?.find((f: { path: string; content: string }) => f.path === path);

    set({
      content: file?.content || "",
      path,
      loading: false,
    });
  },

  updateContent: (value: string | undefined) => set({ content: value ?? "" }),

  saveFile: async (projectId: string) => {
    const { path, content } = get();
    if (!path) return;

    await fetch(`/api/projects/${projectId}/files`, {
      method: "PATCH",
      body: JSON.stringify({ path, content }),
    });
  },
}));
