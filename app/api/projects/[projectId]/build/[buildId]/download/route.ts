import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const build = getBuild(buildId);

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    if (build.status !== "success") {
      return NextResponse.json({ error: "Build not completed or failed" }, { status: 400 });
    }

    const artifactPath = getArtifactPath(projectId, buildId);

    if (!artifactPath || !fs.existsSync(artifactPath)) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
