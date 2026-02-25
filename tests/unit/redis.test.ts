import { describe, it, expect, vi, beforeEach } from "vitest";

describe("redis", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null when env vars not set", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { getRedisClient } = await import("@/lib/redis");
    expect(getRedisClient()).toBeNull();
  });
});
