import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getBuild } from "@/lib/build/buildPipeline";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; buildId: string } }
) {
  try {
    await getCurrentUserId();
    const { buildId } = params;

    const build = getBuild(buildId);

    if (!build) {
      return Response.json({ error: "Build introuvable" }, { status: 404 });
    }

    return Response.json({
      buildId: build.buildId,
      status: build.status,
      progress: build.progress,
      artifactUrl: build.artifactUrl ?? null,
      errorMessage: build.errorMessage ?? null,
      createdAt: build.createdAt,
      startedAt: build.startedAt ?? null,
      completedAt: build.completedAt ?? null,
    });
  } catch {
    return Response.json({ error: "Erreur interne" }, { status: 500 });
  }
}
