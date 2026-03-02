import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { cancelBuild } from "@/lib/build/buildPipeline";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; buildId: string } }
) {
  try {
    await getCurrentUserId();
    const { buildId } = params;

    const cancelled = cancelBuild(buildId);

    if (!cancelled) {
      return Response.json(
        { error: "Build not found or already completed" },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, buildId, status: "cancelled" });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
