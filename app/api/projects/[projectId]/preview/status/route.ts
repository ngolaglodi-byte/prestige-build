import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;

    const preview = await prisma.previewSession.findFirst({
      where: {
        projectId,
        userId,
        status: { in: ["running", "starting"] },
      },
    });

    if (!preview) {
      return NextResponse.json({
        ok: true,
        status: "stopped",
        preview: null,
      });
    }

    return NextResponse.json({
      ok: true,
      status: preview.status,
      preview,
    });
  } catch (err) {
    console.error("❌ Error getting preview status:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
