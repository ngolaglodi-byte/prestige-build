import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Helper to build a chainable Drizzle query mock
function chainMock(result: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  return chain;
}

function mockDb(selectResult: unknown[] = []) {
  const selectChain = chainMock(selectResult);
  const insertChain = chainMock(selectResult);
  const updateChain = chainMock(selectResult);
  return {
    db: {
      select: vi.fn().mockReturnValue(selectChain),
      insert: vi.fn().mockReturnValue(insertChain),
      update: vi.fn().mockReturnValue(updateChain),
    },
  };
}

describe("API Webhooks", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ---------- POST /api/webhooks/settings ----------
  describe("POST /api/webhooks/settings", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => mockDb());
      vi.doMock("@/db/schema", () => ({
        webhookConfigs: {},
        users: { clerkId: "clerkId" },
      }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn() }));

      const { POST } = await import("@/app/api/webhooks/settings/route");
      const req = new Request("http://localhost/api/webhooks/settings", {
        method: "POST",
        body: JSON.stringify({ endpointUrl: "https://example.com/hook" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects missing endpointUrl", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_abc" }),
      }));
      vi.doMock("@/db/client", () => mockDb([{ id: "user_1", clerkId: "clerk_abc" }]));
      vi.doMock("@/db/schema", () => ({
        webhookConfigs: {},
        users: { clerkId: "clerkId" },
      }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn() }));

      const { POST } = await import("@/app/api/webhooks/settings/route");
      const req = new Request("http://localhost/api/webhooks/settings", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });
  });

  // ---------- GET /api/webhooks/logs ----------
  describe("GET /api/webhooks/logs", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => mockDb());
      vi.doMock("@/db/schema", () => ({
        webhookLogs: {},
        users: { clerkId: "clerkId" },
      }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn(), desc: vi.fn() }));

      const { GET } = await import("@/app/api/webhooks/logs/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  // ---------- POST /api/webhooks/retry ----------
  describe("POST /api/webhooks/retry", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => mockDb());
      vi.doMock("@/db/schema", () => ({
        webhookLogs: {},
        users: { clerkId: "clerkId" },
      }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn(), and: vi.fn() }));
      vi.doMock("@/lib/webhooks", () => ({ retryWebhook: vi.fn() }));

      const { POST } = await import("@/app/api/webhooks/retry/route");
      const req = new Request("http://localhost/api/webhooks/retry", {
        method: "POST",
        body: JSON.stringify({ logId: "log_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects missing logId", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_abc" }),
      }));
      vi.doMock("@/db/client", () => mockDb([{ id: "user_1", clerkId: "clerk_abc" }]));
      vi.doMock("@/db/schema", () => ({
        webhookLogs: {},
        users: { clerkId: "clerkId" },
      }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn(), and: vi.fn() }));
      vi.doMock("@/lib/webhooks", () => ({ retryWebhook: vi.fn() }));

      const { POST } = await import("@/app/api/webhooks/retry/route");
      const req = new Request("http://localhost/api/webhooks/retry", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });
  });

  // ---------- POST /api/webhooks/test ----------
  describe("POST /api/webhooks/test", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => mockDb());
      vi.doMock("@/db/schema", () => ({
        users: { clerkId: "clerkId" },
      }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn() }));
      vi.doMock("@/lib/webhooks", () => ({ sendWebhook: vi.fn() }));

      const { POST } = await import("@/app/api/webhooks/test/route");
      const response = await POST();
      expect(response.status).toBe(401);
    });
  });

  // ---------- Webhook signature (HMAC-SHA256) ----------
  describe("Webhook signature validation", () => {
    it("produces consistent HMAC-SHA256 signatures", () => {
      const payload = '{"event":"webhook.test","data":{}}';
      const secret = "whsec_testsecret123";

      const sig1 = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const sig2 = crypto.createHmac("sha256", secret).update(payload).digest("hex");

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64);
    });

    it("produces different signatures for different secrets", () => {
      const payload = '{"event":"webhook.test"}';

      const sig1 = crypto.createHmac("sha256", "secret_a").update(payload).digest("hex");
      const sig2 = crypto.createHmac("sha256", "secret_b").update(payload).digest("hex");

      expect(sig1).not.toBe(sig2);
    });

    it("produces different signatures for different payloads", () => {
      const secret = "whsec_shared";

      const sig1 = crypto.createHmac("sha256", secret).update("payload_a").digest("hex");
      const sig2 = crypto.createHmac("sha256", secret).update("payload_b").digest("hex");

      expect(sig1).not.toBe(sig2);
    });
  });

  // ---------- Exponential backoff delay ----------
  describe("Exponential backoff delay calculation", () => {
    // getRetryDelay(attempt) = 10 * 3^(attempt-1)
    function getRetryDelay(attempt: number): number {
      return 10 * Math.pow(3, attempt - 1);
    }

    it.each([
      [1, 10],
      [2, 30],
      [3, 90],
      [4, 270],
      [5, 810],
    ])("attempt %i returns %i seconds", (attempt, expected) => {
      expect(getRetryDelay(attempt)).toBe(expected);
    });
  });
});
