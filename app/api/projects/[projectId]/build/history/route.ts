import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getProjectBuilds } from "@/lib/build/buildPipeline";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await getCurrentUserId();
    const { projectId } = params;

    const builds = getProjectBuilds(projectId);

    return Response.json({
      builds: builds.map((b) => ({
        buildId: b.buildId,
        target: b.target,
        status: b.status,
        progress: b.progress,
        artifactUrl: b.artifactUrl ?? null,
        errorMessage: b.errorMessage ?? null,
        createdAt: b.createdAt,
        startedAt: b.startedAt ?? null,
        completedAt: b.completedAt ?? null,
      })),
    });
  } catch {
    return Response.json({ error: "Erreur interne" }, { status: 500 });
  }
}
