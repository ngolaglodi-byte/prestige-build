import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, previewSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { stopPreviewServer, startPreviewServer } from "@/lib/preview/previewEngine";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;

    // Resolve Clerk ID to internal user UUID
    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const userId = user.id;

    const previewRows = await db
      .select()
      .from(previewSessions)
      .where(
        and(
          eq(previewSessions.projectId, projectId),
          eq(previewSessions.userId, userId),
          eq(previewSessions.status, "running")
        )
      )
      .limit(1);

    const preview = previewRows[0] ?? null;

    if (preview) {
      await stopPreviewServer(userId, projectId);

      await db
        .update(previewSessions)
        .set({
          status: "stopped",
          stoppedAt: new Date(),
        })
        .where(eq(previewSessions.id, preview.id));
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
