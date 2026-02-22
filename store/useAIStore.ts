"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AISuggestion {
  type: string;
  content: string;
}

interface AIStore {
  messages: AIMessage[];
  suggestions: AISuggestion[];
  addMessage: (msg: AIMessage) => void;
  setSuggestions: (s: AISuggestion[]) => void;
  clearSuggestions: () => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      messages: [],
      suggestions: [],

      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, msg],
        })),

      setSuggestions: (s) => set({ suggestions: s }),

      clearSuggestions: () => set({ suggestions: [] }),

      clearMessages: () => set({ messages: [] }),
    }),

    {
      name: "prestige-ai-messages",
    }
  )
);
