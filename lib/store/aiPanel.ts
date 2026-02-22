import { create } from "zustand";

export const useAiPanel = create((set, get) => ({
  messages: [] as { role: "user" | "assistant"; content: string }[],
  loading: false,

  addUserMessage: (content: string) =>
    set((state) => ({
      messages: [...state.messages, { role: "user", content }],
    })),

  addAssistantMessage: (content: string) =>
    set((state) => ({
      messages: [...state.messages, { role: "assistant", content }],
    })),

  sendPrompt: async (projectId: string, prompt: string, filePath?: string) => {
    if (!prompt.trim()) return;

    const { addUserMessage, addAssistantMessage } = get();
    addUserMessage(prompt);
    set({ loading: true });

    const res = await fetch(`/api/projects/${projectId}/ai`, {
      method: "POST",
      body: JSON.stringify({ prompt, filePath }),
    });

    const data = await res.json();
    if (data.ok) {
      addAssistantMessage(data.message);
    }

    set({ loading: false });
  },
}));
