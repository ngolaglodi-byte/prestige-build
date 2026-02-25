import { describe, it, expect } from "vitest";
import { tokenRules } from "@/lib/ai/tokenRules";

describe("ai/tokenRules", () => {
  it("defines rules for all complexity levels", () => {
    expect(tokenRules.small).toBeDefined();
    expect(tokenRules.medium).toBeDefined();
    expect(tokenRules.large).toBeDefined();
    expect(tokenRules.xl).toBeDefined();
  });

  it("small has lowest token limit", () => {
    expect(tokenRules.small.maxTokens).toBe(2000);
    expect(tokenRules.small.creditCost).toBe(1);
  });

  it("xl has highest token limit", () => {
    expect(tokenRules.xl.maxTokens).toBe(65000);
    expect(tokenRules.xl.creditCost).toBe(15);
  });

  it("token limits increase with complexity", () => {
    expect(tokenRules.small.maxTokens).toBeLessThan(tokenRules.medium.maxTokens);
    expect(tokenRules.medium.maxTokens).toBeLessThan(tokenRules.large.maxTokens);
    expect(tokenRules.large.maxTokens).toBeLessThan(tokenRules.xl.maxTokens);
  });

  it("credit costs increase with complexity", () => {
    expect(tokenRules.small.creditCost).toBeLessThan(tokenRules.medium.creditCost);
    expect(tokenRules.medium.creditCost).toBeLessThan(tokenRules.large.creditCost);
    expect(tokenRules.large.creditCost).toBeLessThan(tokenRules.xl.creditCost);
  });
});
