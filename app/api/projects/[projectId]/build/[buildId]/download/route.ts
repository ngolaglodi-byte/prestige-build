import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUserId } from "@/lib/auth";
import { getBuild } from "@/lib/build/buildPipeline";
import { getArtifactPath, generateDownloadToken } from "@/lib/build/artifactManager";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; buildId: string } }
) {
  try {
    await getCurrentUserId();
    const { projectId, buildId } = params;

    // Validate token
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const expectedToken = generateDownloadToken(buildId, projectId);

    if (token && token !== expectedToken) {
      return new Response("Token invalide", { status: 403 });
    }

    const build = getBuild(buildId);

    if (!build) {
      return new Response("Build introuvable", { status: 404 });
    }

    if (build.status !== "success") {
      return new Response("Build non terminé ou échoué", { status: 400 });
    }

    const artifactPath = getArtifactPath(projectId, buildId);

    if (!artifactPath || !fs.existsSync(artifactPath)) {
      return new Response("Artefact introuvable", { status: 404 });
    }

    const fileName = path.basename(artifactPath);
    const fileContent = fs.readFileSync(artifactPath);

    return new Response(fileContent, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/octet-stream",
        "Content-Length": fileContent.length.toString(),
      },
    });
  } catch {
    return new Response("Erreur interne", { status: 500 });
  }
}
