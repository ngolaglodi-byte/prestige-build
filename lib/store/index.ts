/**
 * Prestige Build — Unified Store Index
 *
 * Consolidated Zustand stores for the entire application.
 * Architecture by Prestige Technologie Company — Glody Dimputu Ngola.
 */

// Client-side UI stores
export { useWorkspaceStore } from "./useWorkspaceStore";
export type { WorkspaceFile } from "./useWorkspaceStore";

export { useNotificationStore } from "./useNotificationStore";
export type { Notification } from "./useNotificationStore";

export { useAIStore } from "./useAIStore";
export type { AIMessage, AISuggestion } from "./useAIStore";

export { useAIPreviewStore } from "./useAIPreviewStore";
export type { AIPreviewItem } from "./useAIPreviewStore";

export { useAIMultiPreviewStore } from "./useAIMultiPreviewStore";
export type { MultiPreviewItem } from "./useAIMultiPreviewStore";

// Feature-specific stores
export { useFileTree } from "./fileTree";
export type { FileNode, FileRecord } from "./fileTree";

export { useAiDiff } from "./aiDiffStore";
export type { DiffItem } from "./aiDiffStore";

export { useLogsStore } from "./logsStore";
export type { LogEntry } from "./logsStore";

export { useAiPanel } from "./aiPanel";

export { useTabs } from "./tabs";

export { useEditor } from "./editor";
