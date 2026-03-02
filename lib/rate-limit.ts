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
 * Atomic Lua script for Redis rate limiting.
 *
 * Increments the counter and sets the expiry in a single atomic operation,
 * preventing race conditions where a key could persist without an expiry
 * if the process crashes between INCR and EXPIRE.
 *
 * KEYS[1] = rate limit key
 * ARGV[1] = window in seconds
 *
 * Returns the current count after increment.
 */
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, window)
end
return current
`;

/**
 * Redis-backed rate limiter using an atomic Lua script (Upstash Redis).
 *
 * Redis key pattern: `rl:<key>`
 *   - key is typically `api:<ip>` for API routes or `<route>:<ip>` for
 *     route-specific limits.
 *   - TTL = ceil(windowMs / 1000) seconds.
 */
async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  if (!redis) return rateLimitMemory(key, limit, windowMs);

  try {
    const redisKey = `rl:${key}`;
    const windowSec = Math.ceil(windowMs / 1000);

    const count = await redis.eval(RATE_LIMIT_LUA, [redisKey], [String(windowSec)]) as number;

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

/**
 * Reusable rate-limit middleware for Next.js API route handlers.
 *
 * @example
 * ```ts
 * import { withRateLimit } from "@/lib/rate-limit";
 *
 * export async function POST(req: NextRequest) {
 *   const rl = await withRateLimit(req, { limit: 10, windowMs: 60_000, prefix: "ai" });
 *   if (rl) return rl; // 429 response
 *   // ... handle request
 * }
 * ```
 */
export async function withRateLimit(
  req: { headers: { get(name: string): string | null } },
  opts: { limit?: number; windowMs?: number; prefix?: string } = {},
): Promise<Response | null> {
  const { limit = MAX_REQUESTS, windowMs = WINDOW_MS, prefix = "api" } = opts;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  const { success } = await rateLimitAsync(`${prefix}:${ip}`, limit, windowMs);

  if (!success) {
    return Response.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)), "X-RateLimit-Remaining": "0" },
      },
    );
  }

  // Attach remaining count — callers can forward this header if desired.
  // Returning null signals "allowed".
  return null;
}

