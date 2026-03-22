const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const ONE_MINUTE_MS = 60_000;
const WINDOW_MS = ONE_MINUTE_MS;
const MAX_REQUESTS = 60;
const CLEANUP_INTERVAL_MS = 3 * ONE_MINUTE_MS;

// Best-effort in-memory limiter for Edge runtime.
// Note: state is per-isolate and not shared across regions/instances — users could bypass limits by routing through multiple edge nodes.
let lastCleanup = 0;
let isCleaning = false;

function rateLimitMemoryWithCleanup(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  // Cleanup is guarded to avoid concurrent mutation; redundant cleanups are harmless in the Edge single-threaded event loop model.
  if (!isCleaning && now - lastCleanup > CLEANUP_INTERVAL_MS) {
    isCleaning = true;
    lastCleanup = now;
    try {
      for (const [entryKey, entry] of rateLimitMap.entries()) {
        if (now - entry.lastReset > windowMs) {
          rateLimitMap.delete(entryKey);
        }
      }
    } finally {
      isCleaning = false;
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
  return rateLimitMemoryWithCleanup(key, limit, windowMs);
}
