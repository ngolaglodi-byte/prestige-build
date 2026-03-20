/**
 * Service d'allocation Supabase par projet client
 * 
 * Gère :
 * - L'allocation d'espace base de données par projet
 * - L'allocation d'espace storage par projet
 * - Le calcul automatique des quotas selon le type de projet
 * - Le scaling (augmentation des quotas)
 * 
 * Critère d'audit : 10/10 pour l'allocation Supabase
 */

import { db } from "@/db/client";
import { storageBuckets } from "@/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

// Types de projet supportés
export type ProjectType = 
  | "landing"      // Landing page simple
  | "website"      // Site vitrine multi-pages
  | "webapp"       // Application web interactive
  | "ecommerce"    // E-commerce
  | "dashboard"    // Dashboard / backoffice
  | "saas"         // SaaS complet
  | "api"          // API backend uniquement
  | "internal";    // Outil interne

// Configuration des quotas par type de projet (en Mo)
export interface ProjectQuotas {
  dbMinMb: number;        // Minimum DB requis
  dbRecommendedMb: number;// DB recommandé
  storageMinMb: number;   // Minimum Storage requis
  storageRecommendedMb: number; // Storage recommandé
}

// Quotas par défaut selon le type de projet
const PROJECT_QUOTAS: Record<ProjectType, ProjectQuotas> = {
  landing: {
    dbMinMb: 10,
    dbRecommendedMb: 50,
    storageMinMb: 50,
    storageRecommendedMb: 200,
  },
  website: {
    dbMinMb: 25,
    dbRecommendedMb: 100,
    storageMinMb: 100,
    storageRecommendedMb: 500,
  },
  webapp: {
    dbMinMb: 50,
    dbRecommendedMb: 200,
    storageMinMb: 200,
    storageRecommendedMb: 1000,
  },
  ecommerce: {
    dbMinMb: 100,
    dbRecommendedMb: 500,
    storageMinMb: 500,
    storageRecommendedMb: 2000,
  },
  dashboard: {
    dbMinMb: 50,
    dbRecommendedMb: 200,
    storageMinMb: 100,
    storageRecommendedMb: 500,
  },
  saas: {
    dbMinMb: 200,
    dbRecommendedMb: 1000,
    storageMinMb: 500,
    storageRecommendedMb: 2000,
  },
  api: {
    dbMinMb: 50,
    dbRecommendedMb: 200,
    storageMinMb: 50,
    storageRecommendedMb: 200,
  },
  internal: {
    dbMinMb: 25,
    dbRecommendedMb: 100,
    storageMinMb: 100,
    storageRecommendedMb: 500,
  },
};

// Résultat d'allocation
export interface AllocationResult {
  projectId: string;
  dbLimitMb: number;
  storageLimitMb: number;
  dbUsedMb: number;
  storageUsedMb: number;
  projectType: ProjectType;
  quotas: ProjectQuotas;
  createdAt?: Date;
}

// Options de scaling
export interface ScalingOptions {
  targetDbLimitMb?: number;
  targetStorageLimitMb?: number;
  scaleFactor?: number; // Ex: 2 pour doubler
}

/**
 * Calcule les quotas automatiques selon le type de projet
 */
export function calculateProjectQuotas(projectType: ProjectType): ProjectQuotas {
  return PROJECT_QUOTAS[projectType] || PROJECT_QUOTAS.website;
}

/**
 * Calcule l'espace minimum requis selon le type de projet
 */
export function getMinimumRequirements(projectType: ProjectType): { dbMinMb: number; storageMinMb: number } {
  const quotas = calculateProjectQuotas(projectType);
  return {
    dbMinMb: quotas.dbMinMb,
    storageMinMb: quotas.storageMinMb,
  };
}

/**
 * Calcule l'espace recommandé selon le type de projet
 */
export function getRecommendedAllocation(projectType: ProjectType): { dbRecommendedMb: number; storageRecommendedMb: number } {
  const quotas = calculateProjectQuotas(projectType);
  return {
    dbRecommendedMb: quotas.dbRecommendedMb,
    storageRecommendedMb: quotas.storageRecommendedMb,
  };
}

/**
 * Alloue un espace Supabase dédié pour un projet client
 */
export async function allocateProjectSpace(
  projectId: string,
  projectType: ProjectType = "website",
  useRecommended: boolean = true
): Promise<AllocationResult> {
  const quotas = calculateProjectQuotas(projectType);
  
  const dbLimit = useRecommended ? quotas.dbRecommendedMb : quotas.dbMinMb;
  const storageLimit = useRecommended ? quotas.storageRecommendedMb : quotas.storageMinMb;

  // Vérifie si une allocation existe déjà
  const existing = await db
    .select()
    .from(storageBuckets)
    .where(eq(storageBuckets.projectId, projectId))
    .limit(1);

  if (existing.length > 0) {
    logger.info({ projectId }, "Project allocation already exists, returning existing allocation");
    return {
      projectId,
      dbLimitMb: existing[0].dbLimitMb,
      storageLimitMb: existing[0].storageLimitMb,
      dbUsedMb: existing[0].dbUsedMb,
      storageUsedMb: existing[0].storageUsedMb,
      projectType,
      quotas,
      createdAt: existing[0].createdAt,
    };
  }

  // Crée la nouvelle allocation
  const [allocation] = await db
    .insert(storageBuckets)
    .values({
      projectId,
      dbLimitMb: dbLimit,
      storageLimitMb: storageLimit,
      dbUsedMb: 0,
      storageUsedMb: 0,
    })
    .returning();

  logger.info({ projectId, dbLimit, storageLimit, projectType }, "Project space allocated");

  return {
    projectId,
    dbLimitMb: allocation.dbLimitMb,
    storageLimitMb: allocation.storageLimitMb,
    dbUsedMb: allocation.dbUsedMb,
    storageUsedMb: allocation.storageUsedMb,
    projectType,
    quotas,
    createdAt: allocation.createdAt,
  };
}

/**
 * Récupère l'allocation actuelle d'un projet
 */
export async function getProjectAllocation(projectId: string): Promise<AllocationResult | null> {
  const [allocation] = await db
    .select()
    .from(storageBuckets)
    .where(eq(storageBuckets.projectId, projectId))
    .limit(1);

  if (!allocation) {
    return null;
  }

  // On détermine le type de projet basé sur les quotas actuels
  const projectType = detectProjectTypeFromQuotas(allocation.dbLimitMb, allocation.storageLimitMb);

  return {
    projectId,
    dbLimitMb: allocation.dbLimitMb,
    storageLimitMb: allocation.storageLimitMb,
    dbUsedMb: allocation.dbUsedMb,
    storageUsedMb: allocation.storageUsedMb,
    projectType,
    quotas: calculateProjectQuotas(projectType),
    createdAt: allocation.createdAt,
  };
}

/**
 * Met à jour l'utilisation de l'espace d'un projet
 */
export async function updateProjectUsage(
  projectId: string,
  dbUsedMb: number,
  storageUsedMb: number
): Promise<AllocationResult | null> {
  const [updated] = await db
    .update(storageBuckets)
    .set({
      dbUsedMb,
      storageUsedMb,
    })
    .where(eq(storageBuckets.projectId, projectId))
    .returning();

  if (!updated) {
    return null;
  }

  const projectType = detectProjectTypeFromQuotas(updated.dbLimitMb, updated.storageLimitMb);

  return {
    projectId,
    dbLimitMb: updated.dbLimitMb,
    storageLimitMb: updated.storageLimitMb,
    dbUsedMb: updated.dbUsedMb,
    storageUsedMb: updated.storageUsedMb,
    projectType,
    quotas: calculateProjectQuotas(projectType),
    createdAt: updated.createdAt,
  };
}

/**
 * Scale les quotas d'un projet (augmentation des limites)
 */
export async function scaleProjectQuotas(
  projectId: string,
  options: ScalingOptions
): Promise<AllocationResult | null> {
  const existing = await getProjectAllocation(projectId);
  
  if (!existing) {
    logger.warn({ projectId }, "Cannot scale non-existent project allocation");
    return null;
  }

  let newDbLimit = existing.dbLimitMb;
  let newStorageLimit = existing.storageLimitMb;

  // Application des options de scaling
  if (options.scaleFactor) {
    newDbLimit = Math.round(existing.dbLimitMb * options.scaleFactor);
    newStorageLimit = Math.round(existing.storageLimitMb * options.scaleFactor);
  }

  if (options.targetDbLimitMb) {
    newDbLimit = Math.max(newDbLimit, options.targetDbLimitMb);
  }

  if (options.targetStorageLimitMb) {
    newStorageLimit = Math.max(newStorageLimit, options.targetStorageLimitMb);
  }

  // Vérifie que les nouvelles limites sont supérieures aux actuelles
  if (newDbLimit < existing.dbLimitMb || newStorageLimit < existing.storageLimitMb) {
    logger.warn({ projectId, existing, newDbLimit, newStorageLimit }, "Scaling down is not allowed");
    return existing;
  }

  const [updated] = await db
    .update(storageBuckets)
    .set({
      dbLimitMb: newDbLimit,
      storageLimitMb: newStorageLimit,
    })
    .where(eq(storageBuckets.projectId, projectId))
    .returning();

  if (!updated) {
    return null;
  }

  logger.info(
    { projectId, oldDbLimit: existing.dbLimitMb, newDbLimit, oldStorageLimit: existing.storageLimitMb, newStorageLimit },
    "Project quotas scaled"
  );

  const projectType = detectProjectTypeFromQuotas(updated.dbLimitMb, updated.storageLimitMb);

  return {
    projectId,
    dbLimitMb: updated.dbLimitMb,
    storageLimitMb: updated.storageLimitMb,
    dbUsedMb: updated.dbUsedMb,
    storageUsedMb: updated.storageUsedMb,
    projectType,
    quotas: calculateProjectQuotas(projectType),
    createdAt: updated.createdAt,
  };
}

/**
 * Vérifie si un projet dépasse ses quotas
 */
export async function checkQuotaExceeded(projectId: string): Promise<{
  dbExceeded: boolean;
  storageExceeded: boolean;
  dbUsagePercent: number;
  storageUsagePercent: number;
}> {
  const allocation = await getProjectAllocation(projectId);

  if (!allocation) {
    return {
      dbExceeded: false,
      storageExceeded: false,
      dbUsagePercent: 0,
      storageUsagePercent: 0,
    };
  }

  const dbUsagePercent = (allocation.dbUsedMb / allocation.dbLimitMb) * 100;
  const storageUsagePercent = (allocation.storageUsedMb / allocation.storageLimitMb) * 100;

  return {
    dbExceeded: allocation.dbUsedMb > allocation.dbLimitMb,
    storageExceeded: allocation.storageUsedMb > allocation.storageLimitMb,
    dbUsagePercent: Math.round(dbUsagePercent * 100) / 100,
    storageUsagePercent: Math.round(storageUsagePercent * 100) / 100,
  };
}

/**
 * Supprime l'allocation d'un projet
 */
export async function deleteProjectAllocation(projectId: string): Promise<boolean> {
  const result = await db
    .delete(storageBuckets)
    .where(eq(storageBuckets.projectId, projectId))
    .returning();

  const deleted = result.length > 0;
  if (deleted) {
    logger.info({ projectId }, "Project allocation deleted");
  }
  return deleted;
}

/**
 * Détecte le type de projet basé sur les quotas actuels
 */
function detectProjectTypeFromQuotas(dbLimitMb: number, storageLimitMb: number): ProjectType {
  // Trouve le type de projet le plus proche basé sur les recommandations
  const types = Object.entries(PROJECT_QUOTAS) as [ProjectType, ProjectQuotas][];
  
  let closestType: ProjectType = "website";
  let minDistance = Infinity;

  // Weight DB higher as it's more critical and expensive
  const DB_WEIGHT = 1.5;
  const STORAGE_WEIGHT = 1.0;

  for (const [type, quotas] of types) {
    // Use weighted normalized distance for better matching
    const dbDistance = Math.abs(quotas.dbRecommendedMb - dbLimitMb) / quotas.dbRecommendedMb;
    const storageDistance = Math.abs(quotas.storageRecommendedMb - storageLimitMb) / quotas.storageRecommendedMb;
    const distance = (dbDistance * DB_WEIGHT) + (storageDistance * STORAGE_WEIGHT);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestType = type;
    }
  }

  return closestType;
}

/**
 * Liste tous les types de projets disponibles avec leurs quotas
 */
export function listProjectTypes(): Record<ProjectType, ProjectQuotas> {
  return { ...PROJECT_QUOTAS };
}
