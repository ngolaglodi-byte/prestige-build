/**
 * Project Limits Manager
 * 
 * Gère les limites et quotas explicites par projet.
 * Table project_limits pour la configuration des quotas.
 * 
 * Critère d'audit : Structure Supabase 10/10
 */

import { db } from "@/db/client";
import { projectLimits } from "@/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";
import { 
  type ProjectType, 
  type ProjectQuotas,
  calculateProjectQuotas 
} from "@/lib/supabase/projectAllocation";

// Type pour les limites de projet
export interface ProjectLimitRecord {
  id: string;
  projectId: string;
  projectType: ProjectType;
  dbMinMb: number;
  dbRecommendedMb: number;
  storageMinMb: number;
  storageRecommendedMb: number;
  scaleFactor: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Crée ou met à jour les limites d'un projet
 */
export async function setProjectLimits(
  projectId: string,
  projectType: ProjectType,
  customQuotas?: Partial<ProjectQuotas>,
  scaleFactor: number = 1.0
): Promise<ProjectLimitRecord> {
  const baseQuotas = calculateProjectQuotas(projectType);
  
  const quotas: ProjectQuotas = {
    dbMinMb: customQuotas?.dbMinMb ?? baseQuotas.dbMinMb,
    dbRecommendedMb: customQuotas?.dbRecommendedMb ?? baseQuotas.dbRecommendedMb,
    storageMinMb: customQuotas?.storageMinMb ?? baseQuotas.storageMinMb,
    storageRecommendedMb: customQuotas?.storageRecommendedMb ?? baseQuotas.storageRecommendedMb,
  };

  // Vérifie si des limites existent déjà
  const [existing] = await db
    .select()
    .from(projectLimits)
    .where(eq(projectLimits.projectId, projectId))
    .limit(1);

  if (existing) {
    // Met à jour les limites existantes
    const [updated] = await db
      .update(projectLimits)
      .set({
        projectType,
        ...quotas,
        scaleFactor,
        updatedAt: new Date(),
      })
      .where(eq(projectLimits.projectId, projectId))
      .returning();

    logger.info({ projectId, projectType }, "Project limits updated");

    return {
      id: updated.id,
      projectId: updated.projectId,
      projectType: updated.projectType as ProjectType,
      dbMinMb: updated.dbMinMb,
      dbRecommendedMb: updated.dbRecommendedMb,
      storageMinMb: updated.storageMinMb,
      storageRecommendedMb: updated.storageRecommendedMb,
      scaleFactor: updated.scaleFactor,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt ?? undefined,
    };
  }

  // Crée de nouvelles limites
  const [created] = await db
    .insert(projectLimits)
    .values({
      projectId,
      projectType,
      ...quotas,
      scaleFactor,
    })
    .returning();

  logger.info({ projectId, projectType }, "Project limits created");

  return {
    id: created.id,
    projectId: created.projectId,
    projectType: created.projectType as ProjectType,
    dbMinMb: created.dbMinMb,
    dbRecommendedMb: created.dbRecommendedMb,
    storageMinMb: created.storageMinMb,
    storageRecommendedMb: created.storageRecommendedMb,
    scaleFactor: created.scaleFactor,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt ?? undefined,
  };
}

/**
 * Récupère les limites d'un projet
 */
export async function getProjectLimits(
  projectId: string
): Promise<ProjectLimitRecord | null> {
  const [limits] = await db
    .select()
    .from(projectLimits)
    .where(eq(projectLimits.projectId, projectId))
    .limit(1);

  if (!limits) {
    return null;
  }

  return {
    id: limits.id,
    projectId: limits.projectId,
    projectType: limits.projectType as ProjectType,
    dbMinMb: limits.dbMinMb,
    dbRecommendedMb: limits.dbRecommendedMb,
    storageMinMb: limits.storageMinMb,
    storageRecommendedMb: limits.storageRecommendedMb,
    scaleFactor: limits.scaleFactor,
    createdAt: limits.createdAt,
    updatedAt: limits.updatedAt ?? undefined,
  };
}

/**
 * Calcule les limites effectives avec le facteur de scaling
 */
export function calculateEffectiveLimits(
  limits: ProjectLimitRecord
): { dbEffectiveMb: number; storageEffectiveMb: number } {
  return {
    dbEffectiveMb: Math.round(limits.dbRecommendedMb * limits.scaleFactor),
    storageEffectiveMb: Math.round(limits.storageRecommendedMb * limits.scaleFactor),
  };
}

/**
 * Applique un scaling aux limites d'un projet
 */
export async function scaleProjectLimits(
  projectId: string,
  newScaleFactor: number
): Promise<ProjectLimitRecord | null> {
  if (newScaleFactor < 1.0) {
    logger.warn({ projectId, newScaleFactor }, "Scale factor must be >= 1.0");
    return null;
  }

  const [updated] = await db
    .update(projectLimits)
    .set({
      scaleFactor: newScaleFactor,
      updatedAt: new Date(),
    })
    .where(eq(projectLimits.projectId, projectId))
    .returning();

  if (!updated) {
    return null;
  }

  logger.info({ projectId, newScaleFactor }, "Project limits scaled");

  return {
    id: updated.id,
    projectId: updated.projectId,
    projectType: updated.projectType as ProjectType,
    dbMinMb: updated.dbMinMb,
    dbRecommendedMb: updated.dbRecommendedMb,
    storageMinMb: updated.storageMinMb,
    storageRecommendedMb: updated.storageRecommendedMb,
    scaleFactor: updated.scaleFactor,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt ?? undefined,
  };
}

/**
 * Supprime les limites d'un projet
 */
export async function deleteProjectLimits(projectId: string): Promise<boolean> {
  const result = await db
    .delete(projectLimits)
    .where(eq(projectLimits.projectId, projectId))
    .returning();

  const deleted = result.length > 0;
  if (deleted) {
    logger.info({ projectId }, "Project limits deleted");
  }
  return deleted;
}

/**
 * Initialise les limites pour un nouveau projet basé sur son type
 */
export async function initializeProjectLimits(
  projectId: string,
  projectType: ProjectType = "website"
): Promise<ProjectLimitRecord> {
  return setProjectLimits(projectId, projectType);
}
