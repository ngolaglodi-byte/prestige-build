import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stopPreviewServer } from "@/lib/preview/previewEngine";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // -----------------------------
    // 1. Auth Clerk
    // -----------------------------
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const projectId = params.projectId;

    if (!projectId) {
      return new Response("Missing projectId in URL", { status: 400 });
    }

    // -----------------------------
    // 2. Lire le body
    // -----------------------------
    const body = await req.json();
    const previewId = body.previewId;

    if (!previewId) {
      return new Response("Missing previewId", { status: 400 });
    }

    // -----------------------------
    // 3. Vérifier que la preview existe
    // -----------------------------
    const preview = await prisma.previewSession.findUnique({
      where: { id: previewId },
    });

    if (!preview) {
      return new Response("Preview not found", { status: 404 });
    }

    // -----------------------------
    // 4. Vérifier que la preview appartient au user
    // -----------------------------
    if (preview.userId !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // -----------------------------
    // 5. Arrêter le serveur de preview
    // -----------------------------
    await stopPreviewServer(preview.userId, preview.projectId);

    // -----------------------------
    // 6. Mettre à jour la preview dans Prisma
    // -----------------------------
    await prisma.previewSession.update({
      where: { id: previewId },
      data: {
        status: "stopped",
        stoppedAt: new Date(),
      },
    });

    // -----------------------------
    // 7. Retourner la réponse
    // -----------------------------
    return Response.json({ ok: true });
  } catch (err) {
    console.error("❌ Error stopping preview:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
