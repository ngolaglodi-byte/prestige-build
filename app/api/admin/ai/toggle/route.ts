import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAiConfig } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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
    const providerId = body.providerId as string | undefined;

    if (!providerId) {
      if (isFormSubmission) {
        redirect("/admin/ai?error=missing_id");
      }
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
    }

    await db
      .update(adminAiConfig)
      .set({ enabled: sql`NOT ${adminAiConfig.enabled}`, updatedAt: new Date() })
      .where(eq(adminAiConfig.id, providerId));

    if (isFormSubmission) {
      redirect("/admin/ai");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ai/toggle] Error:", error);
    if (isFormSubmission) {
      redirect("/admin/ai?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
