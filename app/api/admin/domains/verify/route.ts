import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { domains } from "@/db/schema";
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
    const domainId = body.domainId as string | undefined;

    if (!domainId) {
      if (isForm) {
        redirect("/admin/domains?error=missing_id");
      }
      return NextResponse.json({ error: "Domain ID required" }, { status: 400 });
    }

    await db
      .update(domains)
      .set({ verified: true })
      .where(eq(domains.id, domainId));

    if (isForm) {
      redirect("/admin/domains");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/domains/verify] Error:", error);
    if (isForm) {
      redirect("/admin/domains?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
