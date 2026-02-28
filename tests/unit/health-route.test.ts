import { describe, it, expect, vi, beforeEach } from "vitest";

describe("health route", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("returns HTTP 200 with degraded database when DATABASE_URL is not set", async () => {
    vi.doMock("@/lib/redis", () => ({
      getRedisClient: () => null,
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.services.database.status).toBe("degraded");
    expect(body.services.database.error).toBe("DATABASE_URL not configured");
    expect(body.services.redis.status).toBe("degraded");
    expect(body.services.redis.error).toBe("Redis not configured");
  });
});
