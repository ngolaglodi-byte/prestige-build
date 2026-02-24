// lib/preview/quotaManager.ts

import { db } from "@/db/client";
import { plans, userPlans, userLimits } from "@/db/supabase-schema";
import { eq } from "drizzle-orm";

type UserQuota = {
  maxActivePreviews: number;
  maxCpuPercent: number;
  maxMemoryBytes: number;
};

const DEFAULT_QUOTA: UserQuota = {
  maxActivePreviews: 2,
  maxCpuPercent: 200,
  maxMemoryBytes: 512 * 1024 * 1024,
};

const activePreviewsByUser = new Map<string, number>();
const quotaCache = new Map<string, UserQuota>();

export async function loadUserQuota(userId: string): Promise<UserQuota> {
  if (quotaCache.has(userId)) {
    return quotaCache.get(userId)!;
  }

  const limitsRows = await db
    .select()
    .from(userLimits)
    .where(eq(userLimits.userId, userId))
    .limit(1);

  const limitOverride = limitsRows[0] ?? null;

  if (limitOverride) {
    const q: UserQuota = {
      maxActivePreviews: limitOverride.maxActivePreviews,
      maxCpuPercent: limitOverride.maxCpuPercent,
      maxMemoryBytes: limitOverride.maxMemoryMb * 1024 * 1024,
    };
    quotaCache.set(userId, q);
    return q;
  }

  // fallback plan → UserPlan → Plan
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

  const userPlan = userPlanRows[0] ?? null;

  if (userPlan) {
    const q: UserQuota = {
      maxActivePreviews: userPlan.maxActivePreviews,
      maxCpuPercent: userPlan.maxCpuPercent,
      maxMemoryBytes: userPlan.maxMemoryMb * 1024 * 1024,
    };
    quotaCache.set(userId, q);
    return q;
  }

  quotaCache.set(userId, DEFAULT_QUOTA);
  return DEFAULT_QUOTA;
}

export function getActivePreviews(userId: string): number {
  return activePreviewsByUser.get(userId) || 0;
}

export async function canStartPreview(userId: string): Promise<boolean> {
  const quota = await loadUserQuota(userId);
  const current = getActivePreviews(userId);
  return current < quota.maxActivePreviews;
}

export function registerPreviewStart(userId: string) {
  const current = getActivePreviews(userId);
  activePreviewsByUser.set(userId, current + 1);
}

export function registerPreviewStop(userId: string) {
  const current = getActivePreviews(userId);
  const next = Math.max(0, current - 1);
  activePreviewsByUser.set(userId, next);
}

export async function getUserResourceLimits(userId: string) {
  const quota = await loadUserQuota(userId);
  return {
    maxCpuPercent: quota.maxCpuPercent,
    maxMemoryBytes: quota.maxMemoryBytes,
  };
}
