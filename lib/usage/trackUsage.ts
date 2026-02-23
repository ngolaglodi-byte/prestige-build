import { db } from "@/db/client";
import { usageLogs, activityLogs, subscriptions } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { getPlan } from "@/lib/billing/plans";

/**
 * Enregistre une action dans les logs d'utilisation et d'activité.
 */
export async function trackUsage({
  userId,
  projectId = null,
  action,
  creditsUsed = 0,
  tokensUsed = 0,
  metadata = {},
}: {
  userId: string;
  projectId?: string | null;
  action: string;
  creditsUsed?: number;
  tokensUsed?: number;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(usageLogs).values({
    userId,
    projectId,
    tokensUsed,
    creditsUsed,
    action,
  });

  await db.insert(activityLogs).values({
    userId,
    projectId,
    action,
    metadata,
  });
}

/**
 * Vérifie si l'utilisateur a atteint sa limite de générations IA pour le mois en cours.
 */
export async function checkAIGenerationLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  const plan = getPlan(sub?.plan ?? "free");
  const limit = plan.limits.aiGenerations;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        sql`${usageLogs.action} LIKE 'ai.generate%'`,
        gte(usageLogs.createdAt, startOfMonth)
      )
    );

  const used = Number(result?.count ?? 0);
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
}

/**
 * Récupère le résumé d'utilisation pour le mois en cours.
 */
export async function getUsageSummary(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Résumé par type d'action
  const usageByAction = await db
    .select({
      action: usageLogs.action,
      totalTokens: sql<number>`COALESCE(SUM(${usageLogs.tokensUsed}), 0)`,
      totalCredits: sql<number>`COALESCE(SUM(${usageLogs.creditsUsed}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        gte(usageLogs.createdAt, startOfMonth)
      )
    )
    .groupBy(usageLogs.action);

  // Compteurs spécifiques
  const [aiGenCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        sql`${usageLogs.action} LIKE 'ai.generate%'`,
        gte(usageLogs.createdAt, startOfMonth)
      )
    );

  const [workspaceCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        sql`${usageLogs.action} LIKE 'workspace.%'`,
        gte(usageLogs.createdAt, startOfMonth)
      )
    );

  // Activité récente
  const recentActivity = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        gte(activityLogs.createdAt, startOfMonth)
      )
    )
    .orderBy(sql`${activityLogs.createdAt} DESC`)
    .limit(20);

  // Abonnement et plan
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  const plan = getPlan(sub?.plan ?? "free");

  return {
    plan: {
      id: sub?.plan ?? "free",
      name: plan.name,
      limits: plan.limits,
    },
    credits: {
      remaining: sub?.creditsRemaining ?? 0,
      monthly: sub?.creditsMonthly ?? plan.credits,
    },
    aiGenerations: {
      used: Number(aiGenCount?.count ?? 0),
      limit: plan.limits.aiGenerations,
    },
    workspaceActions: {
      count: Number(workspaceCount?.count ?? 0),
    },
    usageByAction,
    recentActivity,
  };
}
