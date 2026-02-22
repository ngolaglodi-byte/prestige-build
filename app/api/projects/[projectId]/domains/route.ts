import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDefaultSubdomain, normalizeDomain } from "@/lib/deploy/domainUtils";

export async function GET(_req: Request, { params }: any) {
  const { userId } = auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;

  return NextResponse.json({
    subdomain: getDefaultSubdomain(projectId),
    customDomain: null,
  });
}

export async function POST(req: Request, { params }: any) {
  const { userId } = auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const { customDomain } = await req.json();

  const normalized = normalizeDomain(customDomain);

  // TODO: Ajouter le domaine dans Vercel via API
  // await vercelRequest(`/v9/projects/${projectId}/domains`, { ... })

  return NextResponse.json({
    projectId,
    subdomain: getDefaultSubdomain(projectId),
    customDomain: normalized,
  });
}
