/**
 * API Route: GitHub Sync Configuration
 * 
 * GET  - Récupère la configuration de sync GitHub pour un projet
 * POST - Configure la synchronisation GitHub automatique
 * DELETE - Désactive la synchronisation GitHub
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { githubSyncConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateGitHubToken, hasRequiredScopes } from "@/lib/github/keyManager";
import { z } from "zod";
import logger from "@/lib/logger";

// Schema de validation
const SyncConfigSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().default("main"),
  direction: z.enum(["push", "pull", "both"]).default("both"),
  autoSync: z.boolean().default(false),
  githubToken: z.string().min(10),
});

/**
 * GET /api/projects/[projectId]/github/sync
 * Récupère la configuration de sync GitHub
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

  const [config] = await db
    .select({
      id: githubSyncConfigs.id,
      projectId: githubSyncConfigs.projectId,
      owner: githubSyncConfigs.owner,
      repo: githubSyncConfigs.repo,
      branch: githubSyncConfigs.branch,
      direction: githubSyncConfigs.direction,
      autoSync: githubSyncConfigs.autoSync,
      lastSyncAt: githubSyncConfigs.lastSyncAt,
      lastCommitSha: githubSyncConfigs.lastCommitSha,
    })
    .from(githubSyncConfigs)
    .where(eq(githubSyncConfigs.projectId, projectId))
    .limit(1);

  if (!config) {
    return NextResponse.json(
      { configured: false, config: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    configured: true,
    config: {
      ...config,
      repoUrl: `https://github.com/${config.owner}/${config.repo}`,
    },
  });
}

/**
 * POST /api/projects/[projectId]/github/sync
 * Configure la synchronisation GitHub
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

  try {
    const body = await req.json();
    const parsed = SyncConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid data" },
        { status: 422 }
      );
    }

    const { owner, repo, branch, direction, autoSync, githubToken } = parsed.data;

    // Valide le token GitHub
    const tokenValidation = await validateGitHubToken(githubToken);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error ?? "Invalid GitHub token" },
        { status: 401 }
      );
    }

    // Vérifie les scopes requis
    const scopeCheck = hasRequiredScopes(tokenValidation.tokenInfo?.scopes || []);
    if (!scopeCheck.hasAll) {
      return NextResponse.json(
        { error: `Missing GitHub scopes: ${scopeCheck.missing.join(", ")}` },
        { status: 403 }
      );
    }

    // Vérifie si une config existe déjà
    const [existing] = await db
      .select()
      .from(githubSyncConfigs)
      .where(eq(githubSyncConfigs.projectId, projectId))
      .limit(1);

    let config;
    if (existing) {
      // Met à jour la config existante
      [config] = await db
        .update(githubSyncConfigs)
        .set({
          owner,
          repo,
          branch,
          direction,
          autoSync,
          updatedAt: new Date(),
        })
        .where(eq(githubSyncConfigs.projectId, projectId))
        .returning();
    } else {
      // Crée une nouvelle config
      [config] = await db
        .insert(githubSyncConfigs)
        .values({
          projectId,
          userId: currentUser.id,
          owner,
          repo,
          branch,
          direction,
          autoSync,
        })
        .returning();
    }

    logger.info({ projectId, owner, repo, branch, autoSync }, "GitHub sync configured");

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        repoUrl: `https://github.com/${owner}/${repo}`,
      },
    });
  } catch (error) {
    console.error("[github/sync/POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[projectId]/github/sync
 * Désactive la synchronisation GitHub
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  try {
    const result = await db
      .delete(githubSyncConfigs)
      .where(eq(githubSyncConfigs.projectId, projectId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "No sync configuration found" },
        { status: 404 }
      );
    }

    logger.info({ projectId }, "GitHub sync configuration removed");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[github/sync/DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
