import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// Helper to parse request body (JSON or form data)
async function parseBody(req: Request): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return req.json();
  }
  const formData = await req.formData();
  const obj: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isFormSubmission = (req.headers.get("content-type") || "").includes("form");

  try {
    const body = await parseBody(req);
    const logId = body.logId as string | undefined;

    if (!logId) {
      if (isFormSubmission) {
        redirect("/admin/logs?error=missing_id");
      }
      return NextResponse.json({ error: "Log ID required" }, { status: 400 });
    }

    await db.delete(auditLogs).where(eq(auditLogs.id, logId));

    if (isFormSubmission) {
      redirect("/admin/logs");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/logs/delete] Error:", error);
    if (isFormSubmission) {
      redirect("/admin/logs?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
