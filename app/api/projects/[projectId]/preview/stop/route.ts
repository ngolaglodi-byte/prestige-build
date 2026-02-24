import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, previewSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stopPreviewServer } from "@/lib/preview/previewEngine";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // -----------------------------
    // 1. Auth Clerk
    // -----------------------------
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const projectId = params.projectId;

    if (!projectId) {
      return new Response("Missing projectId in URL", { status: 400 });
    }

    // Resolve Clerk ID to internal user UUID
    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const userId = user.id;

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
    const previewRows = await db
      .select()
      .from(previewSessions)
      .where(eq(previewSessions.id, previewId))
      .limit(1);

    const preview = previewRows[0];

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
    // 6. Mettre à jour la preview
    // -----------------------------
    await db
      .update(previewSessions)
      .set({
        status: "stopped",
        stoppedAt: new Date(),
      })
      .where(eq(previewSessions.id, previewId));

    // -----------------------------
    // 7. Retourner la réponse
    // -----------------------------
    return Response.json({ ok: true });
  } catch (err) {
    console.error("❌ Error stopping preview:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
