import { getRedisClient } from "./redis";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // requests per window

/**
 * In-memory rate limiter (fallback when Redis is not configured).
 */
function rateLimitMemory(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.lastReset > windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

/**
 * Redis-backed rate limiter using Upstash Redis.
 */
async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  if (!redis) return rateLimitMemory(key, limit, windowMs);

  try {
    const redisKey = `rl:${key}`;
    const windowSec = Math.ceil(windowMs / 1000);

    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (count > limit) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: limit - count };
  } catch {
    // Fallback to in-memory on Redis errors
    return rateLimitMemory(key, limit, windowMs);
  }
}

/**
 * Rate limit a key. Uses Redis (Upstash) when configured, falls back to in-memory.
 */
export function rateLimit(key: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): { success: boolean; remaining: number } {
  // Synchronous path: use in-memory limiter
  // For async Redis path, use rateLimitAsync
  return rateLimitMemory(key, limit, windowMs);
}

/**
 * Async rate limit using Redis when available.
 */
export async function rateLimitAsync(key: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  if (redis) {
    return rateLimitRedis(key, limit, windowMs);
  }
  return rateLimitMemory(key, limit, windowMs);
}

