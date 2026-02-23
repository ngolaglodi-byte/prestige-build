import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { usageLogs, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ usage: [] });

  const usage = await db
    .select({
      action: usageLogs.action,
      totalTokens: sql<number>`SUM(${usageLogs.tokensUsed})`,
      totalCredits: sql<number>`SUM(${usageLogs.creditsUsed})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(usageLogs)
    .where(eq(usageLogs.userId, user.id))
    .groupBy(usageLogs.action);

  const recentLogs = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.userId, user.id))
    .orderBy(sql`${usageLogs.createdAt} DESC`)
    .limit(20);

  return NextResponse.json({ usage, recentLogs });
}
