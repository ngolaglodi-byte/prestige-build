import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAiConfig } from "@/db/schema";
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
    const providerId = body.providerId as string | undefined;
    const priority = typeof body.priority === "string" ? parseInt(body.priority, 10) : body.priority as number | undefined;
    const maxTokens = typeof body.maxTokens === "string" ? parseInt(body.maxTokens, 10) : body.maxTokens as number | undefined;

    if (!providerId || typeof priority !== "number" || isNaN(priority) || typeof maxTokens !== "number" || isNaN(maxTokens)) {
      if (isForm) {
        redirect("/admin/ai?error=invalid_params");
      }
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await db
      .update(adminAiConfig)
      .set({ priority, maxTokens, updatedAt: new Date() })
      .where(eq(adminAiConfig.id, providerId));

    if (isForm) {
      redirect("/admin/ai");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ai/update] Error:", error);
    if (isForm) {
      redirect("/admin/ai?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
