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

describe("rateLimitAsync with Redis", () => {
  it("uses Redis when configured and allows requests within limit", async () => {
    vi.resetModules();
    const mockIncr = vi.fn().mockResolvedValue(1);
    const mockExpire = vi.fn().mockResolvedValue(true);
    vi.doMock("@/lib/redis", () => ({
      getRedisClient: () => ({ incr: mockIncr, expire: mockExpire }),
    }));
    const mod = await import("@/lib/rate-limit");
    const result = await mod.rateLimitAsync("redis-key", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(mockIncr).toHaveBeenCalledWith("rl:redis-key");
    expect(mockExpire).toHaveBeenCalledWith("rl:redis-key", 60);
  });

  it("blocks requests when Redis count exceeds limit", async () => {
    vi.resetModules();
    const mockIncr = vi.fn().mockResolvedValue(6);
    const mockExpire = vi.fn();
    vi.doMock("@/lib/redis", () => ({
      getRedisClient: () => ({ incr: mockIncr, expire: mockExpire }),
    }));
    const mod = await import("@/lib/rate-limit");
    const result = await mod.rateLimitAsync("redis-block", 5, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("does not set expire when count > 1", async () => {
    vi.resetModules();
    const mockIncr = vi.fn().mockResolvedValue(3);
    const mockExpire = vi.fn();
    vi.doMock("@/lib/redis", () => ({
      getRedisClient: () => ({ incr: mockIncr, expire: mockExpire }),
    }));
    const mod = await import("@/lib/rate-limit");
    const result = await mod.rateLimitAsync("redis-no-expire", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("falls back to in-memory on Redis error", async () => {
    vi.resetModules();
    const mockIncr = vi.fn().mockRejectedValue(new Error("Redis down"));
    vi.doMock("@/lib/redis", () => ({
      getRedisClient: () => ({ incr: mockIncr }),
    }));
    const mod = await import("@/lib/rate-limit");
    const result = await mod.rateLimitAsync("redis-error", 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
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
