const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const ONE_MINUTE_MS = 60_000;
const WINDOW_MS = ONE_MINUTE_MS;
const MAX_REQUESTS = 60;
const CLEANUP_INTERVAL_MS = 5 * ONE_MINUTE_MS;

// Best-effort in-memory limiter for Edge runtime.
// Note: state is per-isolate and not shared across regions/instances.
let lastCleanup = 0;

function rateLimitMemory(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [entryKey, entry] of rateLimitMap.entries()) {
      if (now - entry.lastReset > windowMs) {
        rateLimitMap.delete(entryKey);
      }
    }
  }

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

export async function rateLimitAsyncEdge(
  key: string,
  limit = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<{ success: boolean; remaining: number }> {
  // Edge runtime: always use in-memory limiter
  return rateLimitMemory(key, limit, windowMs);
}
