import { NextRequest, NextResponse } from "next/server";
import {
  createAllEnvironments,
  generateEnvironmentUrl,
  getEnvironmentLabel,
  type EnvironmentType,
} from "@/lib/deploy/environments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId est requis" },
        { status: 400 }
      );
    }

    const environments = createAllEnvironments(projectId);

    return NextResponse.json({ environments });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type") as EnvironmentType | null;

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId est requis" },
      { status: 400 }
    );
  }

  // Generate environment URLs for a project
  const types: EnvironmentType[] = type
    ? [type]
    : ["development", "preview", "production"];

  const environments = types.map((t) => ({
    type: t,
    label: getEnvironmentLabel(t),
    url: generateEnvironmentUrl(projectId, t),
  }));

  return NextResponse.json({ environments });
}
