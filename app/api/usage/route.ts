import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUsageSummary } from "@/lib/usage/trackUsage";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({
      plan: { id: "free", name: "Gratuit", limits: { aiGenerations: 10, workspaceSizeMb: 100, maxProjects: 1 } },
      credits: { remaining: 0, monthly: 10 },
      aiGenerations: { used: 0, limit: 10 },
      workspaceActions: { count: 0 },
      usageByAction: [],
      recentActivity: [],
    });
  }

  const summary = await getUsageSummary(user.id);
  return NextResponse.json(summary);
}
