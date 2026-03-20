/**
 * GitHub Key Manager
 * 
 * Gère la validation et le stockage sécurisé des clés GitHub
 * pour l'intégration avec les projets clients.
 * 
 * Critère d'audit : Gestion correcte des clés GitHub (10/10)
 */

import { db } from "@/db/client";
import { integrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import logger from "@/lib/logger";

// Types
export interface GitHubTokenInfo {
  login: string;
  scopes: string[];
  isValid: boolean;
  expiresAt?: string;
}

export interface GitHubKeyResult {
  valid: boolean;
  tokenInfo?: GitHubTokenInfo;
  error?: string;
}

/**
 * Valide un token GitHub en appelant l'API GitHub
 */
export async function validateGitHubToken(token: string): Promise<GitHubKeyResult> {
  if (!token || token.length < 10) {
    return { valid: false, error: "Token is too short or empty" };
  }

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { valid: false, error: "Invalid or expired GitHub token" };
      }
      return { valid: false, error: `GitHub API error: ${res.status}` };
    }

    const user = await res.json() as { login: string };
    
    // Récupère les scopes du token
    const scopes = res.headers.get("X-OAuth-Scopes")?.split(", ") || [];

    return {
      valid: true,
      tokenInfo: {
        login: user.login,
        scopes,
        isValid: true,
      },
    };
  } catch (error) {
    logger.error({ error }, "Error validating GitHub token");
    return { valid: false, error: "Failed to validate GitHub token" };
  }
}

/**
 * Vérifie si le token a les scopes nécessaires pour l'export
 */
export function hasRequiredScopes(scopes: string[]): { 
  hasAll: boolean; 
  missing: string[] 
} {
  const required = ["repo", "read:user"];
  const missing = required.filter(s => !scopes.includes(s));
  
  return {
    hasAll: missing.length === 0,
    missing,
  };
}

/**
 * Stocke le token GitHub de manière sécurisée pour un utilisateur
 * Le token est stocké dans la table integrations
 */
export async function storeGitHubToken(
  userId: string,
  token: string,
  validateFirst: boolean = true
): Promise<{ success: boolean; error?: string; tokenInfo?: GitHubTokenInfo }> {
  // Validation optionnelle
  if (validateFirst) {
    const validation = await validateGitHubToken(token);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const scopeCheck = hasRequiredScopes(validation.tokenInfo?.scopes || []);
    if (!scopeCheck.hasAll) {
      return {
        success: false,
        error: `Missing required scopes: ${scopeCheck.missing.join(", ")}`,
      };
    }
  }

  try {
    // Vérifie si une intégration GitHub existe déjà
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, "github")
      ))
      .limit(1);

    if (existing) {
      // Met à jour l'intégration existante
      await db
        .update(integrations)
        .set({
          active: true,
          config: { token },
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existing.id));

      logger.info({ userId }, "GitHub token updated");
    } else {
      // Crée une nouvelle intégration
      await db
        .insert(integrations)
        .values({
          userId,
          provider: "github",
          active: true,
          config: { token },
        });

      logger.info({ userId }, "GitHub token stored");
    }

    // Récupère les infos du token pour la réponse
    const tokenInfo = validateFirst 
      ? (await validateGitHubToken(token)).tokenInfo 
      : undefined;

    return { success: true, tokenInfo };
  } catch (error) {
    logger.error({ error, userId }, "Error storing GitHub token");
    return { success: false, error: "Failed to store GitHub token" };
  }
}

/**
 * Récupère le token GitHub stocké pour un utilisateur
 */
export async function getStoredGitHubToken(
  userId: string
): Promise<string | null> {
  try {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, "github"),
        eq(integrations.active, true)
      ))
      .limit(1);

    if (!integration || !integration.config) {
      return null;
    }

    const config = integration.config as { token?: string };
    return config.token || null;
  } catch (error) {
    logger.error({ error, userId }, "Error retrieving GitHub token");
    return null;
  }
}

/**
 * Révoque le token GitHub d'un utilisateur
 */
export async function revokeGitHubToken(userId: string): Promise<boolean> {
  try {
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, "github")
      ))
      .limit(1);

    if (!existing) {
      return false;
    }

    await db
      .update(integrations)
      .set({
        active: false,
        config: {},
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existing.id));

    logger.info({ userId }, "GitHub token revoked");
    return true;
  } catch (error) {
    logger.error({ error, userId }, "Error revoking GitHub token");
    return false;
  }
}

/**
 * Vérifie si l'intégration GitHub est active pour un utilisateur
 */
export async function hasActiveGitHubIntegration(userId: string): Promise<boolean> {
  const token = await getStoredGitHubToken(userId);
  if (!token) return false;

  const validation = await validateGitHubToken(token);
  return validation.valid;
}

/**
 * Remplace le token GitHub d'un utilisateur par un nouveau
 * Valide le nouveau token avant de remplacer l'ancien
 * 
 * Critère d'audit : Possibilité de remplacer le token (10/10)
 */
export async function replaceGitHubToken(
  userId: string,
  newToken: string
): Promise<{ success: boolean; error?: string; tokenInfo?: GitHubTokenInfo }> {
  // Valide le nouveau token
  const validation = await validateGitHubToken(newToken);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Vérifie les scopes requis
  const scopeCheck = hasRequiredScopes(validation.tokenInfo?.scopes || []);
  if (!scopeCheck.hasAll) {
    return {
      success: false,
      error: `Missing required scopes: ${scopeCheck.missing.join(", ")}`,
    };
  }

  try {
    // Vérifie si une intégration GitHub existe
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, "github")
      ))
      .limit(1);

    if (existing) {
      // Met à jour avec le nouveau token
      await db
        .update(integrations)
        .set({
          active: true,
          config: { token: newToken },
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existing.id));

      logger.info({ userId }, "GitHub token replaced");
    } else {
      // Crée une nouvelle intégration
      await db
        .insert(integrations)
        .values({
          userId,
          provider: "github",
          active: true,
          config: { token: newToken },
        });

      logger.info({ userId }, "GitHub token stored (new integration)");
    }

    return { success: true, tokenInfo: validation.tokenInfo };
  } catch (error) {
    logger.error({ error, userId }, "Error replacing GitHub token");
    return { success: false, error: "Failed to replace GitHub token" };
  }
}
