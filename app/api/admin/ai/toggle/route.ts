import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAiConfig } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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
    const providerId = body.providerId as string | undefined;

    if (!providerId) {
      if (isForm) {
        redirect("/admin/ai?error=missing_id");
      }
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
    }

    await db
      .update(adminAiConfig)
      .set({ enabled: sql`NOT ${adminAiConfig.enabled}`, updatedAt: new Date() })
      .where(eq(adminAiConfig.id, providerId));

    if (isForm) {
      redirect("/admin/ai");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ai/toggle] Error:", error);
    if (isForm) {
      redirect("/admin/ai?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
