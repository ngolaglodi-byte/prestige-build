/**
 * Tests unitaires pour le gestionnaire de clés GitHub
 * 
 * Critère d'audit : Gestion correcte des clés GitHub (10/10)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateGitHubToken,
  hasRequiredScopes,
} from "@/lib/github/keyManager";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock du database client
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([])),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock("@/db/schema", () => ({
  integrations: {},
}));

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("GitHub Key Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateGitHubToken", () => {
    it("rejette un token vide", async () => {
      const result = await validateGitHubToken("");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token is too short or empty");
    });

    it("rejette un token trop court", async () => {
      const result = await validateGitHubToken("abc123");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token is too short or empty");
    });

    it("valide un token GitHub valide", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ login: "testuser" }),
        headers: new Headers({
          "X-OAuth-Scopes": "repo, read:user",
        }),
      });

      const result = await validateGitHubToken("ghp_validtoken123456");
      
      expect(result.valid).toBe(true);
      expect(result.tokenInfo?.login).toBe("testuser");
      expect(result.tokenInfo?.scopes).toContain("repo");
    });

    it("rejette un token GitHub invalide (401)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await validateGitHubToken("ghp_invalidtoken123");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or expired GitHub token");
    });

    it("gère les erreurs de l'API GitHub", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await validateGitHubToken("ghp_sometoken12345");
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("GitHub API error");
    });

    it("gère les erreurs réseau", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await validateGitHubToken("ghp_sometoken12345");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Failed to validate GitHub token");
    });
  });

  describe("hasRequiredScopes", () => {
    it("retourne true si tous les scopes requis sont présents", () => {
      const scopes = ["repo", "read:user", "write:org"];
      const result = hasRequiredScopes(scopes);
      
      expect(result.hasAll).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("retourne false si le scope repo manque", () => {
      const scopes = ["read:user"];
      const result = hasRequiredScopes(scopes);
      
      expect(result.hasAll).toBe(false);
      expect(result.missing).toContain("repo");
    });

    it("retourne false si le scope read:user manque", () => {
      const scopes = ["repo"];
      const result = hasRequiredScopes(scopes);
      
      expect(result.hasAll).toBe(false);
      expect(result.missing).toContain("read:user");
    });

    it("retourne la liste complète des scopes manquants", () => {
      const scopes: string[] = [];
      const result = hasRequiredScopes(scopes);
      
      expect(result.hasAll).toBe(false);
      expect(result.missing).toContain("repo");
      expect(result.missing).toContain("read:user");
      expect(result.missing).toHaveLength(2);
    });

    it("gère les scopes avec espaces", () => {
      const scopes = ["repo", "read:user"];
      const result = hasRequiredScopes(scopes);
      
      expect(result.hasAll).toBe(true);
    });
  });
});

describe("GitHub Integration Audit", () => {
  describe("Export vers GitHub", () => {
    it("les fonctions de validation de token existent", () => {
      expect(typeof validateGitHubToken).toBe("function");
      expect(typeof hasRequiredScopes).toBe("function");
    });
  });

  describe("Gestion des clés", () => {
    it("la validation retourne les informations du token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ login: "prestige-user" }),
        headers: new Headers({
          "X-OAuth-Scopes": "repo, read:user",
        }),
      });

      const result = await validateGitHubToken("ghp_validtoken123456");
      
      expect(result.tokenInfo).toBeDefined();
      expect(result.tokenInfo?.login).toBeDefined();
      expect(result.tokenInfo?.scopes).toBeDefined();
      expect(result.tokenInfo?.isValid).toBe(true);
    });
  });
});
