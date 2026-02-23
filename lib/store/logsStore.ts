import { create } from "zustand";

export interface LogEntry {
  message: string;
  timestamp: string;
  type: "info" | "error" | "warn";
}

interface LogsStore {
  aiLogs: LogEntry[];
  buildLogs: LogEntry[];
  errorLogs: LogEntry[];
  runtimeLogs: LogEntry[];
  addAiLog: (message: string, type?: LogEntry["type"]) => void;
  addBuildLog: (message: string, type?: LogEntry["type"]) => void;
  addErrorLog: (message: string, type?: LogEntry["type"]) => void;
  addRuntimeLog: (message: string, type?: LogEntry["type"]) => void;
  clearAiLogs: () => void;
  clearBuildLogs: () => void;
  clearErrorLogs: () => void;
  clearRuntimeLogs: () => void;
}

export const useLogsStore = create<LogsStore>((set) => ({
  aiLogs: [],
  buildLogs: [],
  errorLogs: [],
  runtimeLogs: [],

  addAiLog: (message, type = "info") =>
    set((s) => ({
      aiLogs: [...s.aiLogs, { message, timestamp: new Date().toISOString(), type }],
    })),

  addBuildLog: (message, type = "info") =>
    set((s) => ({
      buildLogs: [...s.buildLogs, { message, timestamp: new Date().toISOString(), type }],
    })),

  addErrorLog: (message, type = "error") =>
    set((s) => ({
      errorLogs: [...s.errorLogs, { message, timestamp: new Date().toISOString(), type }],
    })),

  addRuntimeLog: (message, type = "info") =>
    set((s) => ({
      runtimeLogs: [...s.runtimeLogs, { message, timestamp: new Date().toISOString(), type }],
    })),

  clearAiLogs: () => set({ aiLogs: [] }),
  clearBuildLogs: () => set({ buildLogs: [] }),
  clearErrorLogs: () => set({ errorLogs: [] }),
  clearRuntimeLogs: () => set({ runtimeLogs: [] }),
}));
