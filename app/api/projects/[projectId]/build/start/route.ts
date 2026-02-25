import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { startBuild } from "@/lib/build/buildPipeline";
import type { BuildTarget, BuildOptions } from "@/lib/build/buildTargets";
import { BUILD_TARGETS } from "@/lib/build/buildTargets";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    const { projectId } = params;

    if (!projectId) {
      return Response.json({ error: "projectId manquant" }, { status: 400 });
    }

    const body = await req.json();
    const { target, options } = body as {
      target: BuildTarget;
      options?: BuildOptions;
    };

    if (!target) {
      return Response.json({ error: "Cible de build manquante" }, { status: 400 });
    }

    const validTargets = BUILD_TARGETS.map((t) => t.target);
    if (!validTargets.includes(target)) {
      return Response.json(
        { error: `Cible invalide : ${target}` },
        { status: 400 }
      );
    }

    const build = startBuild(projectId, userId, target, options ?? {});

    return Response.json({
      buildId: build.buildId,
      status: build.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    const status =
      message.includes("Limite") || message.includes("Unauthorized")
        ? 429
        : 500;
    return Response.json({ error: message }, { status });
  }
}
