import { NextRequest } from "next/server";
import path from "path";
import { getCurrentUserId } from "@/lib/auth";
import { detectAvailablePlatforms } from "@/lib/build/platformDetector";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await getCurrentUserId();
    const { projectId } = params;

    const projectPath = path.join(process.cwd(), "workspace", projectId);
    const result = detectAvailablePlatforms(projectPath);

    return Response.json({
      availablePlatforms: result.availablePlatforms,
      availableTargets: result.availableTargets.map((t) => t.target),
      detectedToolchains: result.detectedToolchains,
      allTargets: result.availableTargets,
    });
  } catch {
    return Response.json({ error: "Erreur interne" }, { status: 500 });
  }
}
