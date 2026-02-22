import { create } from "zustand";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiPanelStore {
  messages: Message[];
  loading: boolean;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  sendPrompt: (
    projectId: string,
    prompt: string,
    filePath?: string
  ) => Promise<Record<string, unknown> | undefined>;
}

export const useAiPanel = create<AiPanelStore>((set, get) => ({
  messages: [],
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
    return data;
  },
}));
