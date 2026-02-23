import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { webhookLogs, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ logs: [] });

  const logs = await db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.userId, user.id))
    .orderBy(desc(webhookLogs.createdAt))
    .limit(50);

  return NextResponse.json({ logs });
}
