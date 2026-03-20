import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAiConfig } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
    }

    await db
      .update(adminAiConfig)
      .set({ enabled: sql`NOT ${adminAiConfig.enabled}`, updatedAt: new Date() })
      .where(eq(adminAiConfig.id, providerId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ai/toggle] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
