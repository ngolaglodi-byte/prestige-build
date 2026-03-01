import { describe, it, expect, vi, beforeEach } from "vitest";

describe("API AI Generate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("POST /api/ai/generate", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/lib/ai/provider", () => ({
        AIProvider: vi.fn().mockImplementation(() => ({
          getAvailableModels: vi.fn().mockReturnValue(["gpt"]),
          resolveModel: vi.fn().mockReturnValue("gpt"),
          generateWithFallback: vi.fn(),
        })),
      }));
      vi.doMock("@/lib/credits/consumeCredits", () => ({
        consumeCredits: vi.fn(),
      }));
      vi.doMock("@/lib/credits/checkCredits", () => ({
        checkCredits: vi.fn(),
      }));
      vi.doMock("@/lib/ai/complexity", () => ({
        estimateComplexity: vi.fn(),
      }));
      vi.doMock("@/lib/ai/tokenRules", () => ({
        tokenRules: {},
      }));
      vi.doMock("@/lib/usage/trackUsage", () => ({
        checkAIGenerationLimit: vi.fn(),
      }));

      const { POST } = await import("@/app/api/ai/generate/route");
      const req = new Request("http://localhost/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "Hello" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });
  });
});
