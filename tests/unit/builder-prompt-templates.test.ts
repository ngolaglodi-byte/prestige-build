import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT_GENERATE,
  SYSTEM_PROMPT_ITERATE,
  SYSTEM_PROMPT_SCHEMA,
  buildGeneratePrompt,
  buildIteratePrompt,
} from "@/lib/builder/prompt-templates";

describe("prompt-templates", () => {
  it("SYSTEM_PROMPT_GENERATE contains key instructions", () => {
    expect(SYSTEM_PROMPT_GENERATE).toContain("TypeScript");
    expect(SYSTEM_PROMPT_GENERATE).toContain("Tailwind CSS");
    expect(SYSTEM_PROMPT_GENERATE).toContain("JSON array");
  });

  it("SYSTEM_PROMPT_ITERATE contains modification instructions", () => {
    expect(SYSTEM_PROMPT_ITERATE).toContain("modify existing code");
    expect(SYSTEM_PROMPT_ITERATE).toContain("COMPLETE updated file content");
  });

  it("SYSTEM_PROMPT_SCHEMA contains Drizzle ORM instructions", () => {
    expect(SYSTEM_PROMPT_SCHEMA).toContain("Drizzle ORM");
    expect(SYSTEM_PROMPT_SCHEMA).toContain("pgTable");
    expect(SYSTEM_PROMPT_SCHEMA).toContain("PostgreSQL");
  });

  it("buildGeneratePrompt wraps user message", () => {
    const result = buildGeneratePrompt("create a dashboard");
    expect(result).toContain("User request: create a dashboard");
    expect(result).toContain("Generate the application files.");
  });

  it("buildIteratePrompt includes files context and request", () => {
    const files = [
      { path: "app/page.tsx", content: "export default function Page() {}" },
      { path: "components/Card.tsx", content: "<div>Card</div>" },
    ];
    const result = buildIteratePrompt("add dark mode", files);
    expect(result).toContain("--- app/page.tsx ---");
    expect(result).toContain("--- components/Card.tsx ---");
    expect(result).toContain("Modification request: add dark mode");
    expect(result).toContain("Current files:");
  });

  it("buildIteratePrompt handles empty files array", () => {
    const result = buildIteratePrompt("fix styling", []);
    expect(result).toContain("Modification request: fix styling");
    expect(result).toContain("Current files:");
  });
});
