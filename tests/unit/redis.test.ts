import { describe, it, expect, vi, beforeEach } from "vitest";

describe("redis", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("returns null when env vars not set", async () => {
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns null when only URL is set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("returns null when only token is set", async () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });

  it("creates a Redis client when both env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const { getRedisClient } = await import("@/lib/redis");
    const client = getRedisClient();
    expect(client).not.toBeNull();
  });

  it("returns the same client on subsequent calls", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const { getRedisClient } = await import("@/lib/redis");
    const client1 = getRedisClient();
    const client2 = getRedisClient();
    expect(client1).toBe(client2);
  });
});
