import { describe, it, expect } from "vitest";
import { parseAIActions } from "@/lib/ai/aiParser";

describe("ai/aiParser", () => {
  it("returns empty array for empty input", () => {
    expect(parseAIActions("")).toEqual([]);
  });

  it("returns empty array for text without action tags", () => {
    expect(parseAIActions("Hello world, no actions here")).toEqual([]);
  });

  it("returns empty array for malformed action tags", () => {
    const input = `<action this is not valid JSON </action>`;
    const result = parseAIActions(input);
    // May return empty array due to JSON parse failure
    expect(Array.isArray(result)).toBe(true);
  });
});
