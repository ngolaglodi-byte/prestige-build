import { describe, it, expect, beforeEach } from "vitest";
import {
  buildPlan,
  executeStep,
  executePlan,
  getPlanProgress,
  nextStepId,
  resetStepCounter,
  type AgentContext,
  type AgentStep,
  type StepExecutor,
} from "@/lib/ai/agent";

describe("ai/agent", () => {
  beforeEach(() => {
    resetStepCounter();
  });

  it("nextStepId generates incrementing IDs", () => {
    expect(nextStepId()).toBe("step_1");
    expect(nextStepId()).toBe("step_2");
    expect(nextStepId()).toBe("step_3");
  });

  it("resetStepCounter resets the counter", () => {
    nextStepId();
    nextStepId();
    resetStepCounter();
    expect(nextStepId()).toBe("step_1");
  });

  describe("buildPlan", () => {
    const baseContext: AgentContext = {
      projectId: "proj-1",
      userMessage: "Crée une application",
    };

    it("always includes analyze and plan steps", () => {
      const plan = buildPlan(baseContext);
      const types = plan.steps.map((s) => s.type);
      expect(types).toContain("analyze");
      expect(types).toContain("plan");
    });

    it("detects database requirements", () => {
      const ctx = { ...baseContext, userMessage: "Crée une base de données" };
      const plan = buildPlan(ctx);
      expect(plan.steps.some((s) => s.type === "create_db")).toBe(true);
    });

    it("detects auth requirements", () => {
      const ctx = { ...baseContext, userMessage: "Ajoute un login et signup" };
      const plan = buildPlan(ctx);
      expect(plan.steps.some((s) => s.type === "generate_auth")).toBe(true);
    });

    it("detects API requirements", () => {
      const ctx = { ...baseContext, userMessage: "Crée des API endpoints" };
      const plan = buildPlan(ctx);
      expect(plan.steps.some((s) => s.type === "generate_api")).toBe(true);
    });

    it("detects UI requirements", () => {
      const ctx = { ...baseContext, userMessage: "Ajoute un formulaire et une page" };
      const plan = buildPlan(ctx);
      expect(plan.steps.some((s) => s.type === "generate_ui")).toBe(true);
    });

    it("detects deploy requirements", () => {
      const ctx = { ...baseContext, userMessage: "Déployer l'application" };
      const plan = buildPlan(ctx);
      expect(plan.steps.some((s) => s.type === "deploy")).toBe(true);
    });

    it("falls back to create_file when nothing specific detected", () => {
      const ctx = { ...baseContext, userMessage: "Faire quelque chose" };
      const plan = buildPlan(ctx);
      expect(plan.steps.some((s) => s.type === "create_file")).toBe(true);
    });

    it("sets initial status to pending", () => {
      const plan = buildPlan(baseContext);
      expect(plan.status).toBe("pending");
      for (const step of plan.steps) {
        expect(step.status).toBe("pending");
      }
    });
  });

  describe("executeStep", () => {
    it("marks step as completed on success", async () => {
      const step: AgentStep = {
        id: "s1",
        type: "analyze",
        description: "Test step",
        status: "pending",
      };
      const ctx: AgentContext = {
        projectId: "p1",
        userMessage: "test",
      };
      const executor: StepExecutor = async () => ({ result: "ok" });

      const result = await executeStep(step, ctx, executor);
      expect(result.status).toBe("completed");
      expect(result.output).toEqual({ result: "ok" });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("marks step as failed on error", async () => {
      const step: AgentStep = {
        id: "s2",
        type: "create_file",
        description: "Failing step",
        status: "pending",
      };
      const ctx: AgentContext = {
        projectId: "p1",
        userMessage: "test",
      };
      const executor: StepExecutor = async () => {
        throw new Error("Something went wrong");
      };

      const result = await executeStep(step, ctx, executor);
      expect(result.status).toBe("failed");
      expect(result.error).toBe("Something went wrong");
    });
  });

  describe("executePlan", () => {
    it("executes all steps and marks plan as completed", async () => {
      const ctx: AgentContext = { projectId: "p1", userMessage: "test" };
      const plan = buildPlan(ctx);
      const executor: StepExecutor = async () => ({ ok: true });

      const result = await executePlan(plan, ctx, executor);
      expect(result.status).toBe("completed");
      expect(result.completedAt).toBeDefined();
      for (const step of result.steps) {
        expect(step.status).toBe("completed");
      }
    });

    it("stops on failure and skips remaining steps", async () => {
      const ctx: AgentContext = { projectId: "p1", userMessage: "Crée une API" };
      const plan = buildPlan(ctx);
      let callCount = 0;
      const executor: StepExecutor = async () => {
        callCount++;
        if (callCount === 2) throw new Error("Fail at step 2");
        return { ok: true };
      };

      const result = await executePlan(plan, ctx, executor);
      expect(result.status).toBe("failed");
      expect(result.steps[0].status).toBe("completed");
      expect(result.steps[1].status).toBe("failed");
      // Remaining steps should be skipped
      for (const step of result.steps.slice(2)) {
        expect(step.status).toBe("skipped");
      }
    });
  });

  describe("getPlanProgress", () => {
    it("calculates progress correctly", () => {
      const ctx: AgentContext = { projectId: "p1", userMessage: "Test" };
      const plan = buildPlan(ctx);
      // Manually set some steps as completed
      plan.steps[0].status = "completed";
      plan.steps[1].status = "completed";

      const progress = getPlanProgress(plan);
      expect(progress.total).toBe(plan.steps.length);
      expect(progress.completed).toBe(2);
      expect(progress.failed).toBe(0);
      expect(progress.percent).toBeGreaterThan(0);
    });
  });
});
