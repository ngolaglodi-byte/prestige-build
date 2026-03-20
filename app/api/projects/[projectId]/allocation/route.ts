/**
 * API Route: Project Allocation
 * 
 * GET  - Récupère l'allocation actuelle d'un projet
 * POST - Crée ou met à jour l'allocation d'un projet
 * PUT  - Scale les quotas d'un projet
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getProjectAllocation,
  allocateProjectSpace,
  scaleProjectQuotas,
  updateProjectUsage,
  checkQuotaExceeded,
  type ProjectType,
  type ScalingOptions,
} from "@/lib/supabase/projectAllocation";
import { z } from "zod";

// Schema de validation pour POST
const AllocateSchema = z.object({
  projectType: z.enum([
    "landing", "website", "webapp", "ecommerce", 
    "dashboard", "saas", "api", "internal"
  ]).optional().default("website"),
  useRecommended: z.boolean().optional().default(true),
});

// Schema de validation pour PUT (scaling)
const ScaleSchema = z.object({
  targetDbLimitMb: z.number().positive().optional(),
  targetStorageLimitMb: z.number().positive().optional(),
  scaleFactor: z.number().min(1).max(10).optional(),
});

// Schema de validation pour PATCH (mise à jour usage)
const UpdateUsageSchema = z.object({
  dbUsedMb: z.number().min(0),
  storageUsedMb: z.number().min(0),
});

/**
 * GET /api/projects/[projectId]/allocation
 * Récupère l'allocation actuelle d'un projet
 */
export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  const allocation = await getProjectAllocation(projectId);

  if (!allocation) {
    return NextResponse.json(
      { error: "No allocation found for this project" },
      { status: 404 }
    );
  }

  // Ajoute les informations de dépassement de quota
  const quotaStatus = await checkQuotaExceeded(projectId);

  return NextResponse.json({
    allocation,
    quotaStatus,
  });
}

/**
 * POST /api/projects/[projectId]/allocation
 * Crée une allocation pour un projet
 */
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = AllocateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid data" },
        { status: 422 }
      );
    }

    const { projectType, useRecommended } = parsed.data;

    const allocation = await allocateProjectSpace(
      projectId,
      projectType as ProjectType,
      useRecommended
    );

    return NextResponse.json({ allocation });
  } catch (error) {
    console.error("[allocation/POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[projectId]/allocation
 * Scale les quotas d'un projet (augmentation)
 */
export async function PUT(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Seuls les admins peuvent scaler les quotas
  if (currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }

  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = ScaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid data" },
        { status: 422 }
      );
    }

    const options: ScalingOptions = parsed.data;

    if (!options.targetDbLimitMb && !options.targetStorageLimitMb && !options.scaleFactor) {
      return NextResponse.json(
        { error: "At least one scaling option is required" },
        { status: 400 }
      );
    }

    const allocation = await scaleProjectQuotas(projectId, options);

    if (!allocation) {
      return NextResponse.json(
        { error: "Project allocation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ allocation });
  } catch (error) {
    console.error("[allocation/PUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[projectId]/allocation
 * Met à jour l'utilisation de l'espace d'un projet
 */
export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateUsageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid data" },
        { status: 422 }
      );
    }

    const { dbUsedMb, storageUsedMb } = parsed.data;

    const allocation = await updateProjectUsage(projectId, dbUsedMb, storageUsedMb);

    if (!allocation) {
      return NextResponse.json(
        { error: "Project allocation not found" },
        { status: 404 }
      );
    }

    const quotaStatus = await checkQuotaExceeded(projectId);

    return NextResponse.json({ allocation, quotaStatus });
  } catch (error) {
    console.error("[allocation/PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
