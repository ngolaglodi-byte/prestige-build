import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Enregistre une action dans les logs d'audit.
 */
export async function trackUsage({
  userId,
  projectId = null,
  action,
  metadata = {},
}: {
  userId: string;
  projectId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorUserId: userId,
    action,
    metadata: {
      ...metadata,
      projectId,
    },
  });
}

/**
 * Récupère le résumé d'utilisation (activité récente).
 */
export async function getUsageSummary(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Activité récente
  const recentActivity = await db
    .select()
    .from(auditLogs)
    .where(
      eq(auditLogs.actorUserId, userId)
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);

  return {
    recentActivity,
  };
}
