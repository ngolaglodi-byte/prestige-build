import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  // Verify project exists - only select needed columns
  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== currentUser.id) {
    return NextResponse.json({ ok: false, error: "Access denied" }, { status: 403 });
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

  return NextResponse.json({ ok: true, domains: projectDomains });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;
  const { customDomain } = await req.json();

  if (!customDomain || typeof customDomain !== "string") {
    return NextResponse.json({ ok: false, error: "Domain is required" }, { status: 400 });
  }

  const normalized = normalizeDomain(customDomain);

  if (!isValidCustomDomain(normalized)) {
    return NextResponse.json({ ok: false, error: "Invalid domain" }, { status: 400 });
  }

  // Check if domain already exists
  const [existing] = await db
    .select()
    .from(domains)
    .where(eq(domains.host, normalized));
  if (existing) {
    return NextResponse.json({ ok: false, error: "This domain is already in use" }, { status: 409 });
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
    ok: true,
    domain: created,
    dnsInstructions: {
      type: "CNAME",
      name: normalized,
      value: getCnameTarget(),
    },
  });
}

export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;
  const { domainId } = await req.json();

  if (!domainId) {
    return NextResponse.json({ ok: false, error: "Domain ID is required" }, { status: 400 });
  }

  // Only allow deleting custom domains
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.projectId, projectId)));

  if (!domain) {
    return NextResponse.json({ ok: false, error: "Domain not found" }, { status: 404 });
  }

  if (domain.type === "subdomain") {
    return NextResponse.json(
      { ok: false, error: "Cannot delete the default subdomain" },
      { status: 400 }
    );
  }

  await db.delete(domains).where(eq(domains.id, domainId));

  return NextResponse.json({ ok: true });
}
