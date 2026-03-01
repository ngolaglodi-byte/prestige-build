import { describe, it, expect } from "vitest";
import { detectLanguage } from "@/lib/utils/detect-language";

describe("detectLanguage", () => {
  it("detects TypeScript from .ts extension", () => {
    expect(detectLanguage("src/index.ts")).toBe("typescript");
  });

  it("detects TypeScript from .tsx extension", () => {
    expect(detectLanguage("components/App.tsx")).toBe("typescript");
  });

  it("detects JavaScript from .js extension", () => {
    expect(detectLanguage("utils/helper.js")).toBe("javascript");
  });

  it("detects JavaScript from .jsx extension", () => {
    expect(detectLanguage("components/Button.jsx")).toBe("javascript");
  });

  it("detects CSS", () => {
    expect(detectLanguage("styles/main.css")).toBe("css");
  });

  it("detects SCSS", () => {
    expect(detectLanguage("styles/main.scss")).toBe("scss");
  });

  it("detects HTML", () => {
    expect(detectLanguage("index.html")).toBe("html");
  });

  it("detects JSON", () => {
    expect(detectLanguage("package.json")).toBe("json");
  });

  it("detects Markdown", () => {
    expect(detectLanguage("README.md")).toBe("markdown");
  });

  it("detects Python", () => {
    expect(detectLanguage("main.py")).toBe("python");
  });

  it("detects Rust", () => {
    expect(detectLanguage("main.rs")).toBe("rust");
  });

  it("detects Go", () => {
    expect(detectLanguage("main.go")).toBe("go");
  });

  it("detects YAML for .yml", () => {
    expect(detectLanguage("config.yml")).toBe("yaml");
  });

  it("detects YAML for .yaml", () => {
    expect(detectLanguage("config.yaml")).toBe("yaml");
  });

  it("detects SQL", () => {
    expect(detectLanguage("migrations/001.sql")).toBe("sql");
  });

  it("detects Shell scripts", () => {
    expect(detectLanguage("scripts/deploy.sh")).toBe("shell");
  });

  it("returns plaintext for unknown extension", () => {
    expect(detectLanguage("file.xyz")).toBe("plaintext");
  });

  it("returns plaintext for files without extension", () => {
    expect(detectLanguage("Makefile")).toBe("plaintext");
  });

  it("handles nested paths correctly", () => {
    expect(detectLanguage("src/components/deep/nested/Component.tsx")).toBe("typescript");
  });

  it("handles case-insensitive extension", () => {
    expect(detectLanguage("FILE.JSON")).toBe("json");
  });

  it("detects Vue files as HTML", () => {
    expect(detectLanguage("App.vue")).toBe("html");
  });

  it("detects Svelte files as HTML", () => {
    expect(detectLanguage("App.svelte")).toBe("html");
  });

  it("detects GraphQL", () => {
    expect(detectLanguage("schema.graphql")).toBe("graphql");
  });
});
