import { db } from "@/db/client";
import { previewSessions } from "@/db/schema";
import { plans, userPlans, userLimits } from "@/db/supabase-schema";
import { eq, and } from "drizzle-orm";

/**
 * Types des limites effectives d'un utilisateur
 */
export type EffectiveLimits = {
  maxActivePreviews: number;
  maxCpuPercent: number;
  maxMemoryMb: number;
};

/**
 * Récupère les limites réelles d'un utilisateur :
 * - Plan (Free, Starter, Pro…)
 * - Overrides (UserLimits)
 */
export async function getUserLimits(userId: string): Promise<EffectiveLimits> {
  // Get user's plan via user_plans join
  const userPlanRows = await db
    .select({
      maxActivePreviews: plans.maxActivePreviews,
      maxCpuPercent: plans.maxCpuPercent,
      maxMemoryMb: plans.maxMemoryMb,
    })
    .from(userPlans)
    .innerJoin(plans, eq(userPlans.planId, plans.id))
    .where(eq(userPlans.userId, userId))
    .limit(1);

  const plan = userPlanRows[0] ?? null;

  // Get user-specific overrides
  const overrideRows = await db
    .select()
    .from(userLimits)
    .where(eq(userLimits.userId, userId))
    .limit(1);

  const overrides = overrideRows[0] ?? null;

  if (!plan) {
    // fallback ultra safe
    return {
      maxActivePreviews: 1,
      maxCpuPercent: 20,
      maxMemoryMb: 256,
    };
  }

  return {
    maxActivePreviews: overrides?.maxActivePreviews ?? plan.maxActivePreviews,
    maxCpuPercent: overrides?.maxCpuPercent ?? plan.maxCpuPercent,
    maxMemoryMb: overrides?.maxMemoryMb ?? plan.maxMemoryMb,
  };
}

/**
 * Vérifie si l'utilisateur peut lancer une nouvelle preview
 */
export async function canStartPreview(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const limits = await getUserLimits(userId);

  const activeRows = await db
    .select({ id: previewSessions.id })
    .from(previewSessions)
    .where(
      and(
        eq(previewSessions.userId, userId),
        eq(previewSessions.status, "running")
      )
    );

  const activeCount = activeRows.length;

  if (activeCount >= limits.maxActivePreviews) {
    return {
      allowed: false,
      reason: `Max active previews reached (${limits.maxActivePreviews})`,
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si l'utilisateur peut consommer CPU/RAM
 */
export async function canUseResources(
  userId: string,
  cpuRequested: number,
  memoryRequested: number
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const limits = await getUserLimits(userId);

  if (cpuRequested > limits.maxCpuPercent) {
    return {
      allowed: false,
      reason: `CPU limit exceeded (${cpuRequested}% > ${limits.maxCpuPercent}%)`,
    };
  }

  if (memoryRequested > limits.maxMemoryMb) {
    return {
      allowed: false,
      reason: `Memory limit exceeded (${memoryRequested}MB > ${limits.maxMemoryMb}MB)`,
    };
  }

  return { allowed: true };
}
