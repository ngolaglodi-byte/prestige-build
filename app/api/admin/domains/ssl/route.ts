import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { domains } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID required" }, { status: 400 });
    }

    // Simulates SSL regeneration — in production this would trigger actual SSL cert provisioning
    await db
      .update(domains)
      .set({ verified: true })
      .where(eq(domains.id, domainId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/domains/ssl] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
