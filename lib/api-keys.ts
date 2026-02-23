import { db } from "@/db/client";
import { apiKeys, apiUsageLogs } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import crypto from "crypto";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(rawKey: string) {
  const keyH = hashKey(rawKey);

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyH), eq(apiKeys.revoked, false)))
    .limit(1);

  if (!key) return { valid: false, error: "Invalid or revoked API key" } as const;

  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.apiKeyId, key.id),
        gte(apiUsageLogs.createdAt, oneMinuteAgo)
      )
    );

  const requestCount = Number(result?.count ?? 0);

  if (requestCount >= key.rateLimit) {
    return { valid: false, error: "Rate limit exceeded" } as const;
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id));

  return { valid: true, key } as const;
}

export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number
) {
  await db.insert(apiUsageLogs).values({
    apiKeyId,
    endpoint,
    method,
    statusCode,
  });
}
