const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

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

export async function rateLimitAsyncEdge(
  key: string,
  limit = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<{ success: boolean; remaining: number }> {
  // Edge runtime: always use in-memory limiter
  return rateLimitMemory(key, limit, windowMs);
}
