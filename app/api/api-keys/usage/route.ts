import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { apiKeys, apiUsageLogs, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return NextResponse.json({ usage: [] });

  const url = new URL(req.url);
  const keyId = url.searchParams.get("keyId");

  if (!keyId) {
    return NextResponse.json({ error: "keyId required" }, { status: 400 });
  }

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.id)))
    .limit(1);

  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  const logs = await db
    .select()
    .from(apiUsageLogs)
    .where(eq(apiUsageLogs.apiKeyId, keyId))
    .orderBy(desc(apiUsageLogs.createdAt))
    .limit(50);

  const totalRequests = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiUsageLogs)
    .where(eq(apiUsageLogs.apiKeyId, keyId));

  return NextResponse.json({
    usage: logs,
    totalRequests: Number(totalRequests[0]?.count ?? 0),
  });
}
