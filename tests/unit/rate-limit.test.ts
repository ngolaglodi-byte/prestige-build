import { describe, it, expect, beforeEach, vi } from "vitest";

let rateLimit: typeof import("@/lib/rate-limit").rateLimit;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/rate-limit");
  rateLimit = mod.rateLimit;
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
