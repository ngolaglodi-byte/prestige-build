import { describe, it, expect } from "vitest";
import {
  validatePath,
  validateContent,
  detectOverwrites,
  validateActions,
  type FileAction,
} from "@/lib/ai/safetyValidator";

describe("ai/safetyValidator", () => {
  describe("validatePath", () => {
    it("accepts valid file paths", () => {
      expect(validatePath("src/app/page.tsx")).toEqual([]);
      expect(validatePath("index.ts")).toEqual([]);
      expect(validatePath("lib/utils.js")).toEqual([]);
    });

    it("rejects directory traversal", () => {
      const errors = validatePath("../../../etc/passwd");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("rejects empty paths", () => {
      const errors = validatePath("");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("accepts known extensionless files", () => {
      expect(validatePath("Dockerfile")).toEqual([]);
      expect(validatePath("Makefile")).toEqual([]);
      expect(validatePath("LICENSE")).toEqual([]);
    });

    it("rejects unknown extensionless files", () => {
      const errors = validatePath("randomfile");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("rejects unsupported extensions", () => {
      const errors = validatePath("file.xyz");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("accepts common web extensions", () => {
      expect(validatePath("app.ts")).toEqual([]);
      expect(validatePath("app.tsx")).toEqual([]);
      expect(validatePath("style.css")).toEqual([]);
      expect(validatePath("page.html")).toEqual([]);
      expect(validatePath("config.json")).toEqual([]);
      expect(validatePath("data.yaml")).toEqual([]);
    });
  });

  describe("validateContent", () => {
    it("accepts valid string content", () => {
      expect(validateContent("hello world")).toEqual([]);
    });

    it("accepts empty string", () => {
      expect(validateContent("")).toEqual([]);
    });

    it("rejects undefined content", () => {
      expect(validateContent(undefined)).toHaveLength(1);
    });

    it("rejects null content", () => {
      expect(validateContent(null as any)).toHaveLength(1);
    });
  });

  describe("detectOverwrites", () => {
    it("detects when create action targets existing file", () => {
      const actions: FileAction[] = [
        { path: "index.ts", type: "create", content: "new" },
      ];
      const warnings = detectOverwrites(actions, ["index.ts"]);
      expect(warnings.length).toBe(1);
    });

    it("allows create when file does not exist", () => {
      const actions: FileAction[] = [
        { path: "new.ts", type: "create", content: "code" },
      ];
      const warnings = detectOverwrites(actions, ["existing.ts"]);
      expect(warnings).toEqual([]);
    });

    it("ignores update and delete actions", () => {
      const actions: FileAction[] = [
        { path: "index.ts", type: "update", content: "updated" },
        { path: "old.ts", type: "delete" },
      ];
      const warnings = detectOverwrites(actions, ["index.ts", "old.ts"]);
      expect(warnings).toEqual([]);
    });
  });

  describe("validateActions", () => {
    it("returns valid for correct actions", () => {
      const actions: FileAction[] = [
        { path: "src/app.ts", type: "create", content: "code" },
      ];
      const report = validateActions(actions);
      expect(report.valid).toBe(true);
      expect(report.errors).toEqual([]);
    });

    it("returns invalid for dangerous path", () => {
      const actions: FileAction[] = [
        { path: "../hack.ts", type: "create", content: "code" },
      ];
      const report = validateActions(actions);
      expect(report.valid).toBe(false);
    });

    it("detects overwrites", () => {
      const actions: FileAction[] = [
        { path: "existing.ts", type: "create", content: "new" },
      ];
      const report = validateActions(actions, ["existing.ts"]);
      expect(report.valid).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });
  });
});
