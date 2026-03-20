import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { domains } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const { domainId } = await req.json();

  if (!domainId) {
    return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
  }

  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.projectId, projectId)));

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  if (!domain.verified) {
    return NextResponse.json(
      { error: "Domain must be verified before generating an SSL certificate" },
      { status: 400 }
    );
  }

  // In production, this would trigger actual SSL certificate provisioning (e.g. via Let's Encrypt)
  // For now, we simulate the process
  return NextResponse.json({
    success: true,
    message: "Certificat SSL généré avec succès",
    domain: domain.host,
  });
}
