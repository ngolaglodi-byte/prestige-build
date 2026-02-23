import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { domains, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getDefaultSubdomain,
  normalizeDomain,
  isValidCustomDomain,
  getCnameTarget,
} from "@/lib/deploy/domainUtils";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;

  // Verify project exists
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  // Get existing domains for this project
  let projectDomains = await db
    .select()
    .from(domains)
    .where(eq(domains.projectId, projectId));

  // Auto-create default subdomain if none exists
  const hasSubdomain = projectDomains.some((d) => d.type === "subdomain");
  if (!hasSubdomain) {
    const host = getDefaultSubdomain(projectId);
    const [created] = await db
      .insert(domains)
      .values({
        projectId,
        type: "subdomain",
        host,
        verified: true,
      })
      .onConflictDoNothing()
      .returning();
    if (created) {
      projectDomains = [created, ...projectDomains];
    }
  }

  return NextResponse.json({ domains: projectDomains });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const { customDomain } = await req.json();

  if (!customDomain || typeof customDomain !== "string") {
    return NextResponse.json({ error: "Domaine requis" }, { status: 400 });
  }

  const normalized = normalizeDomain(customDomain);

  if (!isValidCustomDomain(normalized)) {
    return NextResponse.json({ error: "Domaine invalide" }, { status: 400 });
  }

  // Check if domain already exists
  const [existing] = await db
    .select()
    .from(domains)
    .where(eq(domains.host, normalized));
  if (existing) {
    return NextResponse.json({ error: "Ce domaine est déjà utilisé" }, { status: 409 });
  }

  // Insert custom domain
  const [created] = await db
    .insert(domains)
    .values({
      projectId,
      type: "custom",
      host: normalized,
      verified: false,
    })
    .returning();

  return NextResponse.json({
    domain: created,
    dnsInstructions: {
      type: "CNAME",
      name: normalized,
      value: getCnameTarget(),
    },
  });
}

export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const { domainId } = await req.json();

  if (!domainId) {
    return NextResponse.json({ error: "ID du domaine requis" }, { status: 400 });
  }

  // Only allow deleting custom domains
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.projectId, projectId)));

  if (!domain) {
    return NextResponse.json({ error: "Domaine introuvable" }, { status: 404 });
  }

  if (domain.type === "subdomain") {
    return NextResponse.json(
      { error: "Impossible de supprimer le sous-domaine par défaut" },
      { status: 400 }
    );
  }

  await db.delete(domains).where(eq(domains.id, domainId));

  return NextResponse.json({ success: true });
}
