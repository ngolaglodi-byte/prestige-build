import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { users, webhookLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { retryWebhook } from "@/lib/webhooks";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { logId } = await req.json();
  if (!logId) return new Response("logId is required", { status: 400 });

  // Verify ownership
  const [log] = await db
    .select()
    .from(webhookLogs)
    .where(and(eq(webhookLogs.id, logId), eq(webhookLogs.userId, user.id)))
    .limit(1);

  if (!log) return new Response("Log not found", { status: 404 });

  const result = await retryWebhook(logId);
  if (!result) {
    return NextResponse.json(
      { error: "Unable to retry this webhook." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, logId: result });
}
