// lib/ai/aiActions.ts

/**
 * Liste complète des actions IA supportées par Prestige Build.
 * Alignée avec aiExecutor.ts.
 */

export type AIAction =
  | { type: "create_file"; path: string; content: string }
  | { type: "update_file"; path: string; content: string }
  | { type: "append_code"; path: string; content: string }
  | { type: "delete_file"; path: string }
  | { type: "rename_file"; from: string; to: string }
  | { type: "move_file"; from: string; to: string }
  | { type: "create_folder"; path: string }
  | { type: "delete_folder"; path: string }
  | { type: "create_project"; files: { path: string; content: string }[] }
  | { type: "analyze_project" }
  | { type: "dependency_analyzer" }
  | { type: "error_detector" }
  | { type: "refactor_engine" }
  | { type: "auto_fix" }
  | { type: "auto_refactor" }
  | { type: "generate_commit_message" }
  | { type: "project_architect"; payload: string };

/**
 * Payload standardisé pour les réponses IA multi-actions.
 */
export type AIActionsPayload = {
  actions: AIAction[];
};

/**
 * Parseur JSON moderne.
 */
export function parseAIActions(raw: string): AIActionsPayload {
  try {
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.actions)) {
      throw new Error("Invalid AI actions payload");
    }

    return parsed as AIActionsPayload;
  } catch (err) {
    console.error("❌ Failed to parse AI actions:", err);
    return { actions: [] };
  }
}

/**
 * Vérifie qu'une action est valide avant exécution.
 */
export function validateAIAction(action: unknown): action is AIAction {
  if (!action || typeof action !== "object") return false;
  if (!("type" in action) || !(action as AIAction).type) return false;

  const validTypes = [
    "create_file",
    "update_file",
    "append_code",
    "delete_file",
    "rename_file",
    "move_file",
    "create_folder",
    "delete_folder",
    "create_project",
    "analyze_project",
    "dependency_analyzer",
    "error_detector",
    "refactor_engine",
    "auto_fix",
    "auto_refactor",
    "generate_commit_message",
    "project_architect",
  ];

  return validTypes.includes((action as AIAction).type);
}
