import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: "Log ID required" }, { status: 400 });
    }

    await db.delete(auditLogs).where(eq(auditLogs.id, logId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/logs/delete] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
