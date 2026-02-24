import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, previewSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canStartPreview, canUseResources } from "@/lib/limits";

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
    const insertedRows = await db
      .insert(previewSessions)
      .values({
        userId,
        projectId,
        port,
        cpuPercent,
        memoryMb,
        status: "running",
        startedAt: new Date(),
      })
      .returning();

    const preview = insertedRows[0];

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
