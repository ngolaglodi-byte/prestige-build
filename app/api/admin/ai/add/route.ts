import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAiConfig } from "@/db/schema";
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
    const provider = body.provider as string | undefined;
    const priority = typeof body.priority === "string" ? parseInt(body.priority, 10) : body.priority as number | undefined;
    const maxTokens = typeof body.maxTokens === "string" ? parseInt(body.maxTokens, 10) : body.maxTokens as number | undefined;

    if (!provider || typeof priority !== "number" || isNaN(priority) || typeof maxTokens !== "number" || isNaN(maxTokens)) {
      if (isFormSubmission) {
        redirect("/admin/ai?error=invalid_params");
      }
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await db.insert(adminAiConfig).values({ provider, priority, maxTokens });

    if (isFormSubmission) {
      redirect("/admin/ai");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ai/add] Error:", error);
    if (isFormSubmission) {
      redirect("/admin/ai?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
