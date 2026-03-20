import { db } from "@/db/client";
import { previewSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Types des limites effectives d'un utilisateur
 */
export type EffectiveLimits = {
  maxActivePreviews: number;
  maxCpuPercent: number;
  maxMemoryMb: number;
};

// Default limits for all users (internal tool - no billing restrictions)
const DEFAULT_LIMITS: EffectiveLimits = {
  maxActivePreviews: 3,
  maxCpuPercent: 200,
  maxMemoryMb: 512,
};

/**
 * Récupère les limites réelles d'un utilisateur.
 * Sans système de billing, tous les utilisateurs ont les mêmes limites.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserLimits(_userId: string): Promise<EffectiveLimits> {
  return DEFAULT_LIMITS;
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
