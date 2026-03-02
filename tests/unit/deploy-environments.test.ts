import { describe, it, expect } from "vitest";
import {
  createEnvironment,
  createAllEnvironments,
  generateEnvironmentUrl,
  canTransition,
  transitionEnvironment,
  setVariable,
  removeVariable,
  getEnvironmentLabel,
  DEFAULT_ENV_CONFIGS,
  type EnvironmentType,
} from "@/lib/deploy/environments";

describe("deploy/environments", () => {
  describe("DEFAULT_ENV_CONFIGS", () => {
    it("has all three environment types", () => {
      expect(DEFAULT_ENV_CONFIGS.development).toBeDefined();
      expect(DEFAULT_ENV_CONFIGS.preview).toBeDefined();
      expect(DEFAULT_ENV_CONFIGS.production).toBeDefined();
    });

    it("development defaults to dev branch", () => {
      expect(DEFAULT_ENV_CONFIGS.development.branch).toBe("dev");
    });

    it("production defaults to main branch", () => {
      expect(DEFAULT_ENV_CONFIGS.production.branch).toBe("main");
    });
  });

  describe("createEnvironment", () => {
    it("creates an environment with correct type", () => {
      const env = createEnvironment("proj-1", "development");
      expect(env.projectId).toBe("proj-1");
      expect(env.type).toBe("development");
      expect(env.status).toBe("stopped");
    });

    it("uses default branch for the type", () => {
      const env = createEnvironment("proj-1", "production");
      expect(env.branch).toBe("main");
    });

    it("allows overriding config", () => {
      const env = createEnvironment("proj-1", "preview", {
        branch: "feature/test",
      });
      expect(env.branch).toBe("feature/test");
    });
  });

  describe("createAllEnvironments", () => {
    it("creates three environments", () => {
      const envs = createAllEnvironments("proj-1");
      expect(envs).toHaveLength(3);
      const types = envs.map((e) => e.type);
      expect(types).toContain("development");
      expect(types).toContain("preview");
      expect(types).toContain("production");
    });
  });

  describe("generateEnvironmentUrl", () => {
    it("generates dev URL", () => {
      const url = generateEnvironmentUrl("abcd1234-rest", "development");
      expect(url).toBe("https://abcd1234-dev.prestige.build");
    });

    it("generates preview URL", () => {
      const url = generateEnvironmentUrl("abcd1234-rest", "preview");
      expect(url).toBe("https://abcd1234-preview.prestige.build");
    });

    it("generates production URL", () => {
      const url = generateEnvironmentUrl("abcd1234-rest", "production");
      expect(url).toBe("https://abcd1234.prestige.build");
    });
  });

  describe("canTransition", () => {
    it("allows stopped → building", () => {
      expect(canTransition("stopped", "building")).toBe(true);
    });

    it("allows building → deploying", () => {
      expect(canTransition("building", "deploying")).toBe(true);
    });

    it("allows deploying → active", () => {
      expect(canTransition("deploying", "active")).toBe(true);
    });

    it("disallows stopped → active", () => {
      expect(canTransition("stopped", "active")).toBe(false);
    });

    it("disallows active → deploying", () => {
      expect(canTransition("active", "deploying")).toBe(false);
    });
  });

  describe("transitionEnvironment", () => {
    it("transitions to a valid state", () => {
      const env = createEnvironment("p1", "production");
      const building = transitionEnvironment(env, "building");
      expect(building.status).toBe("building");
    });

    it("throws on invalid transition", () => {
      const env = createEnvironment("p1", "production");
      expect(() => transitionEnvironment(env, "active")).toThrow(
        "Transition invalide"
      );
    });

    it("sets URL and deployedAt when transitioning to active", () => {
      let env = createEnvironment("p1", "production");
      env = transitionEnvironment(env, "building");
      env = transitionEnvironment(env, "deploying");
      env = transitionEnvironment(env, "active");
      expect(env.url).toBeDefined();
      expect(env.deployedAt).toBeDefined();
    });
  });

  describe("setVariable / removeVariable", () => {
    it("sets a variable", () => {
      const env = createEnvironment("p1", "development");
      const updated = setVariable(env, "API_KEY", "secret");
      expect(updated.variables.API_KEY).toBe("secret");
    });

    it("removes a variable", () => {
      const env = createEnvironment("p1", "development");
      const withVar = setVariable(env, "API_KEY", "secret");
      const without = removeVariable(withVar, "API_KEY");
      expect(without.variables.API_KEY).toBeUndefined();
    });
  });

  describe("getEnvironmentLabel", () => {
    it("returns French label for development", () => {
      expect(getEnvironmentLabel("development")).toBe("Développement");
    });

    it("returns French label for production", () => {
      expect(getEnvironmentLabel("production")).toBe("Production");
    });
  });
});
