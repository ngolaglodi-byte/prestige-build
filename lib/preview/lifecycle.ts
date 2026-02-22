import { prisma } from "@/lib/prisma";
import { stopPreviewServer } from "./previewEngine";

const IDLE_TIMEOUT_MS = 1000 * 60 * 10; // 10 minutes

export async function cleanupIdlePreviews() {
  const now = new Date();

  const idlePreviews = await prisma.previewSession.findMany({
    where: {
      status: "running",
      updatedAt: {
        lt: new Date(now.getTime() - IDLE_TIMEOUT_MS),
      },
    },
  });

  for (const preview of idlePreviews) {
    await stopPreviewServer(preview.userId, preview.projectId);

    await prisma.previewSession.update({
      where: { id: preview.id },
      data: {
        status: "stopped",
        stoppedAt: new Date(),
      },
    });
  }
}
