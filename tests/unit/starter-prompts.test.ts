import { describe, it, expect } from "vitest";
import { STARTER_PROMPTS } from "@/lib/ai/starterPrompts";

describe("starterPrompts", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(STARTER_PROMPTS)).toBe(true);
    expect(STARTER_PROMPTS.length).toBeGreaterThan(0);
  });

  it("each prompt has icon, label, and prompt fields", () => {
    for (const sp of STARTER_PROMPTS) {
      expect(typeof sp.icon).toBe("string");
      expect(sp.icon.length).toBeGreaterThan(0);
      expect(typeof sp.label).toBe("string");
      expect(sp.label.length).toBeGreaterThan(0);
      expect(typeof sp.prompt).toBe("string");
      expect(sp.prompt.length).toBeGreaterThan(0);
    }
  });

  it("contains expected categories", () => {
    const labels = STARTER_PROMPTS.map((p) => p.label);
    expect(labels).toContain("E-commerce");
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Chat App");
    expect(labels).toContain("Blog/CMS");
  });
});
