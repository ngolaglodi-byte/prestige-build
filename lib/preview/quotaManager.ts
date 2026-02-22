// lib/preview/quotaManager.ts

import { prisma } from "@/lib/db";

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

  const limits = await prisma.userLimits.findUnique({
    where: { userId },
  });

  if (limits) {
    const q: UserQuota = {
      maxActivePreviews: limits.maxActivePreviews,
      maxCpuPercent: limits.maxCpuPercent,
      maxMemoryBytes: limits.maxMemoryMb * 1024 * 1024,
    };
    quotaCache.set(userId, q);
    return q;
  }

  // fallback plan → UserPlan → Plan
  const userPlan = await prisma.userPlan.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (userPlan?.plan) {
    const p = userPlan.plan;
    const q: UserQuota = {
      maxActivePreviews: p.maxActivePreviews,
      maxCpuPercent: p.maxCpuPercent,
      maxMemoryBytes: p.maxMemoryMb * 1024 * 1024,
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
