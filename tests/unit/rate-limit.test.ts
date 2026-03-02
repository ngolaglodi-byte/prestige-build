import { describe, it, expect, beforeEach, vi } from "vitest";

let rateLimit: typeof import("@/lib/rate-limit").rateLimit;
let rateLimitAsync: typeof import("@/lib/rate-limit").rateLimitAsync;
let withRateLimit: typeof import("@/lib/rate-limit").withRateLimit;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/rate-limit");
  rateLimit = mod.rateLimit;
  rateLimitAsync = mod.rateLimitAsync;
  withRateLimit = mod.withRateLimit;
});

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const result = rateLimit("test-key", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 3; i++) {
      rateLimit("block-key", 3, 60_000);
    }
    const result = rateLimit("block-key", 3, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses separate counters for different keys", () => {
    rateLimit("key-a", 1, 60_000);
    const result = rateLimit("key-b", 1, 60_000);
    expect(result.success).toBe(true);
  });
});

describe("rateLimitAsync", () => {
  it("falls back to in-memory when Redis is not configured", async () => {
    const result = await rateLimitAsync("async-key", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

describe("withRateLimit", () => {
  it("returns null when request is within limits", async () => {
    const req = { headers: { get: () => "127.0.0.1" } };
    const result = await withRateLimit(req, { limit: 10, prefix: "test" });
    expect(result).toBeNull();
  });

  it("returns 429 response when limit is exceeded", async () => {
    const req = { headers: { get: () => "10.0.0.1" } };
    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      await withRateLimit(req, { limit: 3, prefix: "wrl" });
    }
    const result = await withRateLimit(req, { limit: 3, prefix: "wrl" });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it("uses 'anonymous' when x-forwarded-for is missing", async () => {
    const req = { headers: { get: () => null } };
    const result = await withRateLimit(req, { limit: 10, prefix: "anon" });
    expect(result).toBeNull();
  });
});
