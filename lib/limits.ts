import { prisma } from "@/lib/prisma";

/**
 * Types des limites effectives d’un utilisateur
 */
export type EffectiveLimits = {
  maxActivePreviews: number;
  maxCpuPercent: number;
  maxMemoryMb: number;
};

/**
 * Récupère les limites réelles d’un utilisateur :
 * - Plan (Free, Starter, Pro…)
 * - Overrides (UserLimits)
 */
export async function getUserLimits(userId: string): Promise<EffectiveLimits> {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      userPlan: {
        include: {
          plan: true,
        },
      },
      limits: true,
    },
  });

  if (!user || !user.userPlan?.plan) {
    // fallback ultra safe
    return {
      maxActivePreviews: 1,
      maxCpuPercent: 20,
      maxMemoryMb: 256,
    };
  }

  const plan = user.userPlan.plan;
  const overrides = user.limits;

  return {
    maxActivePreviews: overrides?.maxActivePreviews ?? plan.maxActivePreviews,
    maxCpuPercent: overrides?.maxCpuPercent ?? plan.maxCpuPercent,
    maxMemoryMb: overrides?.maxMemoryMb ?? plan.maxMemoryMb,
  };
}

/**
 * Vérifie si l’utilisateur peut lancer une nouvelle preview
 */
export async function canStartPreview(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const limits = await getUserLimits(userId);

  const activeCount = await prisma.previewSession.count({
    where: {
      userId,
      status: "running",
    },
  });

  if (activeCount >= limits.maxActivePreviews) {
    return {
      allowed: false,
      reason: `Max active previews reached (${limits.maxActivePreviews})`,
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si l’utilisateur peut consommer CPU/RAM
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
