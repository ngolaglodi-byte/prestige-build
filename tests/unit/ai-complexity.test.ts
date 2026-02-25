import { describe, it, expect } from "vitest";
import { estimateComplexity } from "@/lib/ai/complexity";

describe("estimateComplexity", () => {
  it("returns a valid complexity level", () => {
    const result = estimateComplexity("hello world", "");
    expect(["small", "medium", "large", "xl"]).toContain(result);
  });

  it("returns 'small' for short input", () => {
    const result = estimateComplexity("fix typo", "");
    expect(result).toBe("small");
  });

  it("returns 'medium' for moderate input", () => {
    const prompt = "a".repeat(500);
    const result = estimateComplexity(prompt, "");
    expect(result).toBe("medium");
  });

  it("returns 'large' for long input", () => {
    const prompt = "a".repeat(5000);
    const result = estimateComplexity(prompt, "");
    expect(result).toBe("large");
  });

  it("returns 'xl' for very long input", () => {
    const prompt = "a".repeat(20000);
    const result = estimateComplexity(prompt, "");
    expect(result).toBe("xl");
  });

  it("estimates higher complexity for longer prompts", () => {
    const short = estimateComplexity("fix typo", "");
    const long = estimateComplexity(
      "Refactor the entire authentication system to support multi-tenant architecture with role-based access control, implement OAuth2 with multiple providers, add session management, and create comprehensive unit tests",
      "function auth() { return true; }"
    );
    const order = ["small", "medium", "large", "xl"];
    expect(order.indexOf(long)).toBeGreaterThanOrEqual(order.indexOf(short));
  });
});
