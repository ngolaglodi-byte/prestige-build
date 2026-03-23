import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { domains } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  // Verify project exists - only select needed columns
  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== currentUser.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;
  const { customDomain } = await req.json();

  if (!customDomain || typeof customDomain !== "string") {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  const normalized = normalizeDomain(customDomain);

  if (!isValidCustomDomain(normalized)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  // Check if domain already exists
  const [existing] = await db
    .select()
    .from(domains)
    .where(eq(domains.host, normalized));
  if (existing) {
    return NextResponse.json({ error: "This domain is already in use" }, { status: 409 });
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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;
  const { domainId } = await req.json();

  if (!domainId) {
    return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
  }

  // Only allow deleting custom domains
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.projectId, projectId)));

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  if (domain.type === "subdomain") {
    return NextResponse.json(
      { error: "Cannot delete the default subdomain" },
      { status: 400 }
    );
  }

  await db.delete(domains).where(eq(domains.id, domainId));

  return NextResponse.json({ success: true });
}
