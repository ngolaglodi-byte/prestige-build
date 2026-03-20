/**
 * Tests unitaires pour l'allocation Supabase par projet client
 * 
 * Critère d'audit : Score 10/10 pour l'allocation Supabase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateProjectQuotas,
  getMinimumRequirements,
  getRecommendedAllocation,
  listProjectTypes,
  type ProjectType,
  type ProjectQuotas,
} from "@/lib/supabase/projectAllocation";

// Mock du database client pour les tests
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
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: "test-id",
          projectId: "test-project",
          dbLimitMb: 100,
          storageLimitMb: 500,
          dbUsedMb: 0,
          storageUsedMb: 0,
          createdAt: new Date(),
        }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{
            id: "test-id",
            projectId: "test-project",
            dbLimitMb: 200,
            storageLimitMb: 1000,
            dbUsedMb: 0,
            storageUsedMb: 0,
            createdAt: new Date(),
          }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{}])),
      })),
    })),
  },
}));

vi.mock("@/db/schema", () => ({
  storageBuckets: {},
}));

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Allocation Supabase par projet client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateProjectQuotas", () => {
    it("retourne les quotas corrects pour un projet landing", () => {
      const quotas = calculateProjectQuotas("landing");
      
      expect(quotas.dbMinMb).toBe(10);
      expect(quotas.dbRecommendedMb).toBe(50);
      expect(quotas.storageMinMb).toBe(50);
      expect(quotas.storageRecommendedMb).toBe(200);
    });

    it("retourne les quotas corrects pour un projet webapp", () => {
      const quotas = calculateProjectQuotas("webapp");
      
      expect(quotas.dbMinMb).toBe(50);
      expect(quotas.dbRecommendedMb).toBe(200);
      expect(quotas.storageMinMb).toBe(200);
      expect(quotas.storageRecommendedMb).toBe(1000);
    });

    it("retourne les quotas corrects pour un projet ecommerce", () => {
      const quotas = calculateProjectQuotas("ecommerce");
      
      expect(quotas.dbMinMb).toBe(100);
      expect(quotas.dbRecommendedMb).toBe(500);
      expect(quotas.storageMinMb).toBe(500);
      expect(quotas.storageRecommendedMb).toBe(2000);
    });

    it("retourne les quotas corrects pour un projet saas", () => {
      const quotas = calculateProjectQuotas("saas");
      
      expect(quotas.dbMinMb).toBe(200);
      expect(quotas.dbRecommendedMb).toBe(1000);
      expect(quotas.storageMinMb).toBe(500);
      expect(quotas.storageRecommendedMb).toBe(2000);
    });

    it("retourne les quotas corrects pour un projet api", () => {
      const quotas = calculateProjectQuotas("api");
      
      expect(quotas.dbMinMb).toBe(50);
      expect(quotas.dbRecommendedMb).toBe(200);
      expect(quotas.storageMinMb).toBe(50);
      expect(quotas.storageRecommendedMb).toBe(200);
    });

    it("retourne les quotas website par défaut pour un type inconnu", () => {
      // @ts-expect-error - Test avec un type invalide volontairement
      const quotas = calculateProjectQuotas("unknown" as ProjectType);
      
      // Devrait retourner les quotas par défaut (website)
      expect(quotas.dbMinMb).toBe(25);
      expect(quotas.dbRecommendedMb).toBe(100);
    });
  });

  describe("getMinimumRequirements", () => {
    it("retourne les exigences minimales pour un projet landing", () => {
      const requirements = getMinimumRequirements("landing");
      
      expect(requirements.dbMinMb).toBe(10);
      expect(requirements.storageMinMb).toBe(50);
    });

    it("retourne les exigences minimales pour un projet dashboard", () => {
      const requirements = getMinimumRequirements("dashboard");
      
      expect(requirements.dbMinMb).toBe(50);
      expect(requirements.storageMinMb).toBe(100);
    });

    it("retourne les exigences minimales pour un projet internal", () => {
      const requirements = getMinimumRequirements("internal");
      
      expect(requirements.dbMinMb).toBe(25);
      expect(requirements.storageMinMb).toBe(100);
    });
  });

  describe("getRecommendedAllocation", () => {
    it("retourne l'allocation recommandée pour un projet landing", () => {
      const recommended = getRecommendedAllocation("landing");
      
      expect(recommended.dbRecommendedMb).toBe(50);
      expect(recommended.storageRecommendedMb).toBe(200);
    });

    it("retourne l'allocation recommandée pour un projet ecommerce", () => {
      const recommended = getRecommendedAllocation("ecommerce");
      
      expect(recommended.dbRecommendedMb).toBe(500);
      expect(recommended.storageRecommendedMb).toBe(2000);
    });

    it("retourne l'allocation recommandée pour un projet saas", () => {
      const recommended = getRecommendedAllocation("saas");
      
      expect(recommended.dbRecommendedMb).toBe(1000);
      expect(recommended.storageRecommendedMb).toBe(2000);
    });
  });

  describe("listProjectTypes", () => {
    it("retourne tous les types de projets disponibles", () => {
      const types = listProjectTypes();
      
      expect(Object.keys(types)).toContain("landing");
      expect(Object.keys(types)).toContain("website");
      expect(Object.keys(types)).toContain("webapp");
      expect(Object.keys(types)).toContain("ecommerce");
      expect(Object.keys(types)).toContain("dashboard");
      expect(Object.keys(types)).toContain("saas");
      expect(Object.keys(types)).toContain("api");
      expect(Object.keys(types)).toContain("internal");
    });

    it("retourne 8 types de projets", () => {
      const types = listProjectTypes();
      expect(Object.keys(types)).toHaveLength(8);
    });

    it("chaque type de projet a des quotas valides", () => {
      const types = listProjectTypes();
      
      for (const [type, quotas] of Object.entries(types)) {
        expect(quotas.dbMinMb).toBeGreaterThan(0);
        expect(quotas.dbRecommendedMb).toBeGreaterThanOrEqual(quotas.dbMinMb);
        expect(quotas.storageMinMb).toBeGreaterThan(0);
        expect(quotas.storageRecommendedMb).toBeGreaterThanOrEqual(quotas.storageMinMb);
      }
    });
  });

  describe("Validation des règles de quota", () => {
    it("les quotas recommandés sont toujours >= aux quotas minimum", () => {
      const types: ProjectType[] = [
        "landing", "website", "webapp", "ecommerce", 
        "dashboard", "saas", "api", "internal"
      ];
      
      for (const type of types) {
        const quotas = calculateProjectQuotas(type);
        
        expect(quotas.dbRecommendedMb).toBeGreaterThanOrEqual(quotas.dbMinMb);
        expect(quotas.storageRecommendedMb).toBeGreaterThanOrEqual(quotas.storageMinMb);
      }
    });

    it("les projets saas ont les quotas les plus élevés pour la DB", () => {
      const saasQuotas = calculateProjectQuotas("saas");
      const types: ProjectType[] = [
        "landing", "website", "webapp", "dashboard", "api", "internal"
      ];
      
      for (const type of types) {
        const quotas = calculateProjectQuotas(type);
        expect(saasQuotas.dbRecommendedMb).toBeGreaterThanOrEqual(quotas.dbRecommendedMb);
      }
    });

    it("les projets landing ont les quotas les plus bas", () => {
      const landingQuotas = calculateProjectQuotas("landing");
      const types: ProjectType[] = [
        "website", "webapp", "ecommerce", "dashboard", "saas", "internal"
      ];
      
      for (const type of types) {
        const quotas = calculateProjectQuotas(type);
        expect(landingQuotas.dbMinMb).toBeLessThanOrEqual(quotas.dbMinMb);
      }
    });
  });
});

describe("Structure Supabase", () => {
  it("les quotas ont la structure attendue", () => {
    const quotas = calculateProjectQuotas("website");
    
    expect(quotas).toHaveProperty("dbMinMb");
    expect(quotas).toHaveProperty("dbRecommendedMb");
    expect(quotas).toHaveProperty("storageMinMb");
    expect(quotas).toHaveProperty("storageRecommendedMb");
    
    expect(typeof quotas.dbMinMb).toBe("number");
    expect(typeof quotas.dbRecommendedMb).toBe("number");
    expect(typeof quotas.storageMinMb).toBe("number");
    expect(typeof quotas.storageRecommendedMb).toBe("number");
  });
});
