/**
 * Multi-step AI Agent — orchestrates complex plans by chaining actions.
 *
 * The agent receives a high-level user goal, decomposes it into ordered
 * steps (analyse → plan → generate → modify → deploy), executes each
 * step sequentially, and reports progress/errors back to the caller.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentStepType =
  | "analyze"
  | "plan"
  | "create_file"
  | "update_file"
  | "delete_file"
  | "create_db"
  | "update_db"
  | "generate_api"
  | "generate_ui"
  | "generate_auth"
  | "generate_routing"
  | "deploy"
  | "custom";

export type AgentStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface AgentStep {
  id: string;
  type: AgentStepType;
  description: string;
  status: AgentStepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

export interface AgentPlan {
  id: string;
  goal: string;
  projectId: string;
  steps: AgentStep[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
}

export interface AgentContext {
  projectId: string;
  projectType?: string;
  existingFiles?: string[];
  userMessage: string;
}

// ---------------------------------------------------------------------------
// Step ID generator
// ---------------------------------------------------------------------------

let stepCounter = 0;
export function nextStepId(): string {
  return `step_${++stepCounter}`;
}
export function resetStepCounter(): void {
  stepCounter = 0;
}

// ---------------------------------------------------------------------------
// Plan builder — decomposes a goal into ordered steps
// ---------------------------------------------------------------------------

export function buildPlan(context: AgentContext): AgentPlan {
  const steps: AgentStep[] = [];
  const goal = context.userMessage.toLowerCase();

  // Step 1: Always start with analysis
  steps.push({
    id: nextStepId(),
    type: "analyze",
    description: "Analyse du contexte et des fichiers existants",
    status: "pending",
  });

  // Step 2: Planning
  steps.push({
    id: nextStepId(),
    type: "plan",
    description: "Élaboration du plan d'exécution",
    status: "pending",
  });

  // Detect what the user wants and add appropriate steps
  const needsDb =
    goal.includes("database") ||
    goal.includes("db") ||
    goal.includes("base de données") ||
    goal.includes("modèle") ||
    goal.includes("schema");

  const needsAuth =
    goal.includes("auth") ||
    goal.includes("connexion") ||
    goal.includes("login") ||
    goal.includes("inscription") ||
    goal.includes("signup");

  const needsApi =
    goal.includes("api") ||
    goal.includes("endpoint") ||
    goal.includes("route") ||
    goal.includes("backend");

  const needsUi =
    goal.includes("ui") ||
    goal.includes("page") ||
    goal.includes("composant") ||
    goal.includes("component") ||
    goal.includes("interface") ||
    goal.includes("formulaire");

  const needsRouting =
    goal.includes("routing") ||
    goal.includes("navigation") ||
    goal.includes("page");

  const needsDeploy =
    goal.includes("deploy") ||
    goal.includes("déployer") ||
    goal.includes("publier");

  if (needsDb) {
    steps.push({
      id: nextStepId(),
      type: "create_db",
      description: "Création/modification du schéma de base de données",
      status: "pending",
    });
  }

  if (needsAuth) {
    steps.push({
      id: nextStepId(),
      type: "generate_auth",
      description: "Génération de la logique d'authentification",
      status: "pending",
    });
  }

  if (needsApi) {
    steps.push({
      id: nextStepId(),
      type: "generate_api",
      description: "Génération des routes API",
      status: "pending",
    });
  }

  if (needsUi) {
    steps.push({
      id: nextStepId(),
      type: "generate_ui",
      description: "Génération des composants UI",
      status: "pending",
    });
  }

  if (needsRouting) {
    steps.push({
      id: nextStepId(),
      type: "generate_routing",
      description: "Configuration du routage et de la navigation",
      status: "pending",
    });
  }

  // If nothing specific detected, at least generate files
  if (!needsDb && !needsAuth && !needsApi && !needsUi && !needsRouting) {
    steps.push({
      id: nextStepId(),
      type: "create_file",
      description: "Génération des fichiers du projet",
      status: "pending",
    });
  }

  if (needsDeploy) {
    steps.push({
      id: nextStepId(),
      type: "deploy",
      description: "Déploiement automatique du projet",
      status: "pending",
    });
  }

  return {
    id: crypto.randomUUID(),
    goal: context.userMessage,
    projectId: context.projectId,
    steps,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Step execution
// ---------------------------------------------------------------------------

export type StepExecutor = (
  step: AgentStep,
  context: AgentContext
) => Promise<Record<string, unknown>>;

export async function executeStep(
  step: AgentStep,
  context: AgentContext,
  executor: StepExecutor
): Promise<AgentStep> {
  const start = Date.now();
  const running: AgentStep = { ...step, status: "running" };

  try {
    const output = await executor(running, context);
    return {
      ...running,
      status: "completed",
      output,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ...running,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// Plan executor — runs all steps sequentially, stops on failure
// ---------------------------------------------------------------------------

export interface PlanExecutionCallbacks {
  onStepStart?: (step: AgentStep, index: number) => void;
  onStepComplete?: (step: AgentStep, index: number) => void;
  onPlanComplete?: (plan: AgentPlan) => void;
}

export async function executePlan(
  plan: AgentPlan,
  context: AgentContext,
  executor: StepExecutor,
  callbacks?: PlanExecutionCallbacks
): Promise<AgentPlan> {
  const updatedSteps: AgentStep[] = [];
  let failed = false;

  const runningPlan: AgentPlan = { ...plan, status: "running" };

  for (let i = 0; i < runningPlan.steps.length; i++) {
    const step = runningPlan.steps[i];

    if (failed) {
      updatedSteps.push({ ...step, status: "skipped" });
      continue;
    }

    callbacks?.onStepStart?.(step, i);
    const result = await executeStep(step, context, executor);
    updatedSteps.push(result);
    callbacks?.onStepComplete?.(result, i);

    if (result.status === "failed") {
      failed = true;
    }
  }

  const completedPlan: AgentPlan = {
    ...runningPlan,
    steps: updatedSteps,
    status: failed ? "failed" : "completed",
    completedAt: new Date().toISOString(),
  };

  callbacks?.onPlanComplete?.(completedPlan);
  return completedPlan;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPlanProgress(plan: AgentPlan): {
  total: number;
  completed: number;
  failed: number;
  percent: number;
} {
  const total = plan.steps.length;
  const completed = plan.steps.filter((s) => s.status === "completed").length;
  const failed = plan.steps.filter((s) => s.status === "failed").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, failed, percent };
}
