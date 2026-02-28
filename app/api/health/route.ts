import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

type ServiceStatus = "ok" | "degraded" | "down";

interface ServiceCheck {
  status: ServiceStatus;
  latencyMs?: number;
  error?: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  if (!process.env.DATABASE_URL) {
    return { status: "degraded", error: "DATABASE_URL not configured" };
  }
  const start = Date.now();
  try {
    const { db } = await import("@/db/client");
    await db.execute("SELECT 1");
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const redis = getRedisClient();
    if (!redis) return { status: "degraded", error: "Redis not configured" };
    await redis.ping();
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function checkAIProviders(): ServiceCheck {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;

  if (hasOpenAI || hasAnthropic || hasGoogle) {
    return { status: "ok" };
  }
  return { status: "degraded", error: "No AI provider API keys configured" };
}

export async function GET() {
  const [database, redis, ai] = await Promise.all([
    checkDatabase().catch((err): ServiceCheck => ({
      status: "down",
      error: err instanceof Error ? err.message : "Unknown error",
    })),
    checkRedis().catch((err): ServiceCheck => ({
      status: "down",
      error: err instanceof Error ? err.message : "Unknown error",
    })),
    Promise.resolve(checkAIProviders()),
  ]);

  const services = { database, redis, ai };
  const allOk = Object.values(services).every((s) => s.status === "ok");
  const anyDown = Object.values(services).some((s) => s.status === "down");

  const overallStatus = allOk ? "healthy" : anyDown ? "unhealthy" : "degraded";
  const httpStatus = anyDown ? 503 : 200;

  return NextResponse.json(
    {
      ok: !anyDown,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      uptime: process.uptime(),
      services,
    },
    { status: httpStatus }
  );
}
