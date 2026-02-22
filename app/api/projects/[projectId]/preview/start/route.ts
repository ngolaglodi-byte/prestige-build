import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { canStartPreview, canUseResources } from "@/lib/limits";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // -----------------------------
    // 1. Auth Clerk
    // -----------------------------
    const { userId } = auth();

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
    const cpuPercent = body.cpuPercent ?? 10;
    const memoryMb = body.memoryMb ?? 128;
    const port = body.port ?? 3000;

    // -----------------------------
    // 3. Vérifier le quota PREVIEWS
    // -----------------------------
    const previewCheck = await canStartPreview(userId);

    if (!previewCheck.allowed) {
      return new Response(previewCheck.reason, { status: 403 });
    }

    // -----------------------------
    // 4. Vérifier le quota CPU/RAM
    // -----------------------------
    const resourceCheck = await canUseResources(
      userId,
      cpuPercent,
      memoryMb
    );

    if (!resourceCheck.allowed) {
      return new Response(resourceCheck.reason, { status: 403 });
    }

    // -----------------------------
    // 5. Créer la preview session
    // -----------------------------
    const preview = await prisma.previewSession.create({
      data: {
        userId,
        projectId,
        port,
        cpuPercent,
        memoryMb,
        status: "running",
        startedAt: new Date(),
      },
    });

    // -----------------------------
    // 6. Retourner la preview
    // -----------------------------
    return Response.json({
      ok: true,
      port: preview.port,
      previewId: preview.id,
    });
  } catch (err) {
    console.error("❌ Error starting preview:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
