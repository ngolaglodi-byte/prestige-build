import { describe, it, expect } from "vitest";
import { parseGeneratedFiles, mergeFiles } from "@/lib/builder/code-generator";

describe("builder/code-generator", () => {
  describe("parseGeneratedFiles", () => {
    it("parses a valid JSON array", () => {
      const input = JSON.stringify([
        { path: "app/page.tsx", content: "<div />" },
        { path: "components/Button.tsx", content: "export default function Button() {}" },
      ]);
      const result = parseGeneratedFiles(input);
      expect(result).toHaveLength(2);
      expect(result[0].path).toBe("app/page.tsx");
    });

    it("extracts JSON from markdown code block", () => {
      const input = '```json\n[{"path":"a.tsx","content":"hello"}]\n```';
      const result = parseGeneratedFiles(input);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("hello");
    });

    it("returns empty array for invalid input", () => {
      expect(parseGeneratedFiles("not json")).toEqual([]);
    });

    it("filters out entries without path or content", () => {
      const input = JSON.stringify([
        { path: "valid.tsx", content: "code" },
        { path: "no-content" },
        { content: "no-path" },
      ]);
      const result = parseGeneratedFiles(input);
      expect(result).toHaveLength(1);
    });
  });

  describe("mergeFiles", () => {
    it("merges two file arrays, replacing duplicates", () => {
      const existing = [
        { path: "a.tsx", content: "old" },
        { path: "b.tsx", content: "keep" },
      ];
      const incoming = [{ path: "a.tsx", content: "new" }, { path: "c.tsx", content: "add" }];
      const result = mergeFiles(existing, incoming);
      expect(result).toHaveLength(3);
      expect(result.find((f) => f.path === "a.tsx")?.content).toBe("new");
    });
  });
});
