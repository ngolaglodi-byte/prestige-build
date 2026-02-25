import { describe, it, expect } from "vitest";
import { PLANS, getPlan, type PlanId } from "@/lib/billing/plans";

describe("billing/plans", () => {
  it("defines three plans", () => {
    expect(Object.keys(PLANS)).toHaveLength(3);
  });

  it("has free, pro, and enterprise plans", () => {
    expect(PLANS.free).toBeDefined();
    expect(PLANS.pro).toBeDefined();
    expect(PLANS.enterprise).toBeDefined();
  });

  it("free plan costs $0", () => {
    expect(PLANS.free.priceUsd).toBe(0);
  });

  it("pro plan costs $20", () => {
    expect(PLANS.pro.priceUsd).toBe(20);
  });

  it("enterprise plan costs $70", () => {
    expect(PLANS.enterprise.priceUsd).toBe(70);
  });

  it("free plan has 10 credits", () => {
    expect(PLANS.free.credits).toBe(10);
  });

  it("pro plan allows 20 projects", () => {
    expect(PLANS.pro.limits.maxProjects).toBe(20);
  });

  it("enterprise plan has unlimited projects (-1)", () => {
    expect(PLANS.enterprise.limits.maxProjects).toBe(-1);
  });

  describe("getPlan", () => {
    it("returns the correct plan by id", () => {
      expect(getPlan("pro").id).toBe("pro");
    });

    it("falls back to free for unknown plan ids", () => {
      expect(getPlan("unknown").id).toBe("free");
    });

    it("falls back to free for empty string", () => {
      expect(getPlan("").id).toBe("free");
    });
  });

  it("each plan has features array", () => {
    for (const plan of Object.values(PLANS)) {
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("each plan has valid limits", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.limits.aiGenerations).toBeGreaterThan(0);
      expect(plan.limits.workspaceSizeMb).toBeGreaterThan(0);
    }
  });
});
