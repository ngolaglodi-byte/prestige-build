import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { domains } from "@/db/schema";
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
    const domainId = body.domainId as string | undefined;

    if (!domainId) {
      if (isFormSubmission) {
        redirect("/admin/domains?error=missing_id");
      }
      return NextResponse.json({ error: "Domain ID required" }, { status: 400 });
    }

    await db
      .update(domains)
      .set({ verified: true })
      .where(eq(domains.id, domainId));

    if (isFormSubmission) {
      redirect("/admin/domains");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/domains/verify] Error:", error);
    if (isFormSubmission) {
      redirect("/admin/domains?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
