import { db } from "@/db/client";
import { previewSessions } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { stopPreviewServer } from "./previewEngine";

const IDLE_TIMEOUT_MS = 1000 * 60 * 10; // 10 minutes

export async function cleanupIdlePreviews() {
  const now = new Date();

  const idlePreviews = await db
    .select()
    .from(previewSessions)
    .where(
      and(
        eq(previewSessions.status, "running"),
        lt(previewSessions.lastActivityAt, new Date(now.getTime() - IDLE_TIMEOUT_MS))
      )
    );

  for (const preview of idlePreviews) {
    await stopPreviewServer(preview.userId, preview.projectId);

    await db
      .update(previewSessions)
      .set({
        status: "stopped",
        stoppedAt: new Date(),
      })
      .where(eq(previewSessions.id, preview.id));
  }
}
