import { describe, it, expect, vi, beforeEach } from "vitest";
import { isBinaryPath, MAX_FILE_SIZE } from "@/lib/github/importer";

describe("github/importer", () => {
  describe("isBinaryPath", () => {
    it("identifies PNG as binary", () => {
      expect(isBinaryPath("images/logo.png")).toBe(true);
    });

    it("identifies JPG as binary", () => {
      expect(isBinaryPath("photo.jpg")).toBe(true);
    });

    it("identifies WOFF2 as binary", () => {
      expect(isBinaryPath("fonts/inter.woff2")).toBe(true);
    });

    it("identifies lock files as binary", () => {
      expect(isBinaryPath("package-lock.lock")).toBe(true);
    });

    it("identifies TypeScript as non-binary", () => {
      expect(isBinaryPath("src/index.ts")).toBe(false);
    });

    it("identifies JavaScript as non-binary", () => {
      expect(isBinaryPath("lib/utils.js")).toBe(false);
    });

    it("identifies JSON as non-binary", () => {
      expect(isBinaryPath("package.json")).toBe(false);
    });

    it("identifies CSS as non-binary", () => {
      expect(isBinaryPath("styles/global.css")).toBe(false);
    });

    it("identifies Markdown as non-binary", () => {
      expect(isBinaryPath("README.md")).toBe(false);
    });
  });

  describe("MAX_FILE_SIZE", () => {
    it("is set to 500KB", () => {
      expect(MAX_FILE_SIZE).toBe(500 * 1024);
    });
  });
});
