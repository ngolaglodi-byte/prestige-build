import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stopPreviewServer, startPreviewServer } from "@/lib/preview/previewEngine";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;

    const preview = await prisma.previewSession.findFirst({
      where: { projectId, userId, status: "running" },
    });

    if (preview) {
      await stopPreviewServer(preview.port);

      await prisma.previewSession.update({
        where: { id: preview.id },
        data: {
          status: "stopped",
          stoppedAt: new Date(),
        },
      });
    }

    const newPreview = await startPreviewServer(userId, projectId);

    return Response.json({
      ok: true,
      preview: newPreview,
    });
  } catch (err) {
    console.error("❌ Error restarting preview:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
