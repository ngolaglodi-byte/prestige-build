import { create } from "zustand";

export const useEditor = create((set, get) => ({
  content: "",
  path: null,
  loading: false,

  loadFile: async (projectId, path) => {
    set({ loading: true });

    const res = await fetch(`/api/projects/${projectId}/files`);
    const data = await res.json();

    const file = data.files.find((f) => f.path === path);

    set({
      content: file?.content || "",
      path,
      loading: false,
    });
  },

  updateContent: (value) => set({ content: value }),

  saveFile: async (projectId) => {
    const { path, content } = get();
    if (!path) return;

    await fetch(`/api/projects/${projectId}/files`, {
      method: "PATCH",
      body: JSON.stringify({ path, content }),
    });
  },
}));
