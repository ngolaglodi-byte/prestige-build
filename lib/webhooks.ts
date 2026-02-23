import crypto from "crypto";
import { db } from "@/db/client";
import { webhookLogs, webhookConfigs } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";

const MAX_ATTEMPTS = 5;

// Exponential backoff delays in seconds: 10s, 30s, 90s, 270s, 810s
function getRetryDelay(attempt: number): number {
  return 10 * Math.pow(3, attempt - 1);
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function sendWebhook({
  userId,
  event,
  data,
}: {
  userId: string;
  event: string;
  data: Record<string, unknown>;
}) {
  const [config] = await db
    .select()
    .from(webhookConfigs)
    .where(and(eq(webhookConfigs.userId, userId), eq(webhookConfigs.active, true)))
    .limit(1);

  if (!config) return null;

  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  const signature = signPayload(payload, config.signingSecret);

  const [log] = await db
    .insert(webhookLogs)
    .values({
      userId,
      webhookConfigId: config.id,
      event,
      endpointUrl: config.endpointUrl,
      payload: { event, data },
      status: "pending",
      attempt: 1,
      maxAttempts: MAX_ATTEMPTS,
    })
    .returning();

  await deliverWebhook(log.id, config.endpointUrl, payload, signature);
  return log.id;
}

export async function deliverWebhook(
  logId: string,
  endpointUrl: string,
  payload: string,
  signature: string
) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Id": logId,
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await res.text().catch(() => "");

    if (res.ok) {
      await db
        .update(webhookLogs)
        .set({ status: "success", statusCode: res.status, response: responseText.slice(0, 1000) })
        .where(eq(webhookLogs.id, logId));
    } else {
      await handleFailure(logId, res.status, responseText.slice(0, 1000));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await handleFailure(logId, 0, message);
  }
}

async function handleFailure(logId: string, statusCode: number, response: string) {
  const [log] = await db.select().from(webhookLogs).where(eq(webhookLogs.id, logId)).limit(1);
  if (!log) return;

  if (log.attempt < log.maxAttempts) {
    const delaySec = getRetryDelay(log.attempt);
    const nextRetryAt = new Date(Date.now() + delaySec * 1000);

    await db
      .update(webhookLogs)
      .set({
        status: "retrying",
        statusCode,
        response,
        nextRetryAt,
      })
      .where(eq(webhookLogs.id, logId));
  } else {
    await db
      .update(webhookLogs)
      .set({ status: "failed", statusCode, response })
      .where(eq(webhookLogs.id, logId));
  }
}

export async function retryWebhook(logId: string) {
  const [log] = await db.select().from(webhookLogs).where(eq(webhookLogs.id, logId)).limit(1);
  if (!log || (log.status !== "failed" && log.status !== "retrying")) return null;

  const [config] = await db
    .select()
    .from(webhookConfigs)
    .where(eq(webhookConfigs.id, log.webhookConfigId))
    .limit(1);

  if (!config) return null;

  const newAttempt = log.attempt + 1;
  await db
    .update(webhookLogs)
    .set({ attempt: newAttempt, status: "pending", nextRetryAt: null })
    .where(eq(webhookLogs.id, logId));

  const payloadData = log.payload as Record<string, unknown>;
  const payload = JSON.stringify({
    event: log.event,
    data: payloadData.data ?? payloadData,
    timestamp: new Date().toISOString(),
  });
  const signature = signPayload(payload, config.signingSecret);

  await deliverWebhook(logId, log.endpointUrl, payload, signature);
  return logId;
}

export async function processRetries() {
  const pending = await db
    .select()
    .from(webhookLogs)
    .where(
      and(
        eq(webhookLogs.status, "retrying"),
        lte(webhookLogs.nextRetryAt, new Date())
      )
    )
    .limit(20);

  for (const log of pending) {
    await retryWebhook(log.id);
  }

  return pending.length;
}
