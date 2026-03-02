import { describe, it, expect } from "vitest";
import { getComponentById, getComponentsByCategory, COMPONENT_REGISTRY } from "@/lib/editor/component-registry";

describe("editor/component-registry", () => {
  it("has at least 10 registered components", () => {
    expect(COMPONENT_REGISTRY.length).toBeGreaterThanOrEqual(10);
  });

  it("finds a component by id", () => {
    const btn = getComponentById("button");
    expect(btn).toBeDefined();
    expect(btn?.tag).toBe("button");
  });

  it("returns undefined for unknown id", () => {
    expect(getComponentById("nonexistent")).toBeUndefined();
  });

  it("filters components by category", () => {
    const inputs = getComponentsByCategory("input");
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((c) => expect(c.category).toBe("input"));
  });
});
