import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { parseBody, isFormSubmission } from "@/lib/api/parseBody";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isForm = isFormSubmission(req);

  try {
    const body = await parseBody(req);
    const logId = body.logId as string | undefined;

    if (!logId) {
      if (isForm) {
        redirect("/admin/logs?error=missing_id");
      }
      return NextResponse.json({ error: "Log ID required" }, { status: 400 });
    }

    await db.delete(auditLogs).where(eq(auditLogs.id, logId));

    if (isForm) {
      redirect("/admin/logs");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/logs/delete] Error:", error);
    if (isForm) {
      redirect("/admin/logs?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
