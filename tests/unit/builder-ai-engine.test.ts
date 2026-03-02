import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mockCreate } };
  },
}));

import { generateFromPrompt, iterateOnCode } from "@/lib/builder/ai-engine";

const cannedResponse = (content: string) => ({
  choices: [{ message: { content } }],
});

describe("ai-engine", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("generateFromPrompt returns parsed files", async () => {
    const files = JSON.stringify([
      { path: "app/page.tsx", content: "export default function Page() {}" },
    ]);
    mockCreate.mockResolvedValue(cannedResponse(files));

    const result = await generateFromPrompt("create a landing page");
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("app/page.tsx");
    expect(result.rawResponse).toBe(files);
  });

  it("generateFromPrompt returns empty files on invalid JSON", async () => {
    mockCreate.mockResolvedValue(cannedResponse("not json"));

    const result = await generateFromPrompt("test");
    expect(result.files).toEqual([]);
  });

  it("generateFromPrompt passes history messages", async () => {
    const files = JSON.stringify([]);
    mockCreate.mockResolvedValue(cannedResponse(files));

    await generateFromPrompt("test", [
      { role: "user", content: "previous message" },
    ]);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages.length).toBeGreaterThan(2);
  });

  it("iterateOnCode sends existing files in prompt", async () => {
    const files = JSON.stringify([
      { path: "app/page.tsx", content: "updated" },
    ]);
    mockCreate.mockResolvedValue(cannedResponse(files));

    const result = await iterateOnCode("add dark mode", [
      { path: "app/page.tsx", content: "original" },
    ]);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].content).toBe("updated");
  });

  it("iterateOnCode handles empty choices", async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: {} }] });

    const result = await iterateOnCode("test", []);
    expect(result.files).toEqual([]);
    expect(result.rawResponse).toBe("[]");
  });

  it("generateFromPrompt uses correct model config", async () => {
    mockCreate.mockResolvedValue(cannedResponse("[]"));

    await generateFromPrompt("test");
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.2);
    expect(callArgs.max_tokens).toBe(4096);
  });
});
