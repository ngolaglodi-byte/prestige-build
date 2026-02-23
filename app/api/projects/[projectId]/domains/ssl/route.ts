import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { domains } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const { domainId } = await req.json();

  if (!domainId) {
    return NextResponse.json({ error: "ID du domaine requis" }, { status: 400 });
  }

  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.projectId, projectId)));

  if (!domain) {
    return NextResponse.json({ error: "Domaine introuvable" }, { status: 404 });
  }

  if (!domain.verified) {
    return NextResponse.json(
      { error: "Le domaine doit être vérifié avant de générer un certificat SSL" },
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
