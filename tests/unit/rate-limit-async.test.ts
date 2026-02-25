import { describe, it, expect, beforeEach, vi } from "vitest";

let rateLimit: typeof import("@/lib/rate-limit").rateLimit;
let rateLimitAsync: typeof import("@/lib/rate-limit").rateLimitAsync;

beforeEach(async () => {
  vi.resetModules();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const mod = await import("@/lib/rate-limit");
  rateLimit = mod.rateLimit;
  rateLimitAsync = mod.rateLimitAsync;
});

describe("rateLimitAsync", () => {
  it("falls back to in-memory when Redis is not configured", async () => {
    const result = await rateLimitAsync("async-key", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit in async mode", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimitAsync("async-block", 3, 60_000);
    }
    const result = await rateLimitAsync("async-block", 3, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses separate counters for different keys in async", async () => {
    await rateLimitAsync("async-a", 1, 60_000);
    const result = await rateLimitAsync("async-b", 1, 60_000);
    expect(result.success).toBe(true);
  });
});

describe("rateLimit (sync)", () => {
  it("allows requests within the limit", () => {
    const result = rateLimit("sync-test", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 3; i++) {
      rateLimit("sync-block", 3, 60_000);
    }
    const result = rateLimit("sync-block", 3, 60_000);
    expect(result.success).toBe(false);
  });

  it("uses default limit and window when not specified", () => {
    const result = rateLimit("default-test");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59); // 60 - 1
  });

  it("resets counter after window expires", async () => {
    rateLimit("expire-test", 1, 50);
    let result = rateLimit("expire-test", 1, 50);
    expect(result.success).toBe(false);
    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60));
    result = rateLimit("expire-test", 1, 50);
    expect(result.success).toBe(true);
  });
});
