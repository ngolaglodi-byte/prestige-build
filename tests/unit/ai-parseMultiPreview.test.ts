import { describe, it, expect } from "vitest";
import { parseAIMultiPreview } from "@/lib/ai/parseMultiPreview";

describe("parseAIMultiPreview", () => {
  it("parses multi-file preview format", () => {
    const input = `
<file path="src/app/page.tsx">
<old>
console.log("Old code");
</old>
<new>
console.log("New AI code");
</new>
</file>
`;
    const result = parseAIMultiPreview(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      path: "src/app/page.tsx",
      oldContent: 'console.log("Old code");',
      newContent: 'console.log("New AI code");',
    });
  });

  it("parses multiple file blocks", () => {
    const input = `
<file path="a.ts">
<old>old a</old>
<new>new a</new>
</file>
<file path="b.ts">
<old>old b</old>
<new>new b</new>
</file>
`;
    const result = parseAIMultiPreview(input);
    expect(result.length).toBe(2);
    expect(result[0].path).toBe("a.ts");
    expect(result[1].path).toBe("b.ts");
  });

  it("returns empty array for empty input", () => {
    const result = parseAIMultiPreview("");
    expect(result).toEqual([]);
  });

  it("skips blocks missing old or new tags", () => {
    const input = `
<file path="broken.ts">
<old>only old</old>
</file>
`;
    const result = parseAIMultiPreview(input);
    expect(result).toEqual([]);
  });
});
