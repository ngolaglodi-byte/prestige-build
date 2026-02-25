import { describe, it, expect } from "vitest";
import {
  getDefaultSubdomain,
  generateSlug,
  getSlugSubdomain,
  normalizeDomain,
  getCnameTarget,
  isValidCustomDomain,
} from "@/lib/deploy/domainUtils";

describe("deploy/domainUtils", () => {
  describe("getDefaultSubdomain", () => {
    it("generates subdomain from project id", () => {
      const result = getDefaultSubdomain("my-project");
      expect(result).toBe("my-project.prestige-build.dev");
    });
  });

  describe("generateSlug", () => {
    it("lowercases and slugifies a name", () => {
      expect(generateSlug("My Cool Project")).toBe("my-cool-project");
    });

    it("removes accents", () => {
      expect(generateSlug("Café Résumé")).toBe("cafe-resume");
    });

    it("removes special characters", () => {
      expect(generateSlug("hello@world!")).toBe("hello-world");
    });

    it("trims leading/trailing hyphens", () => {
      expect(generateSlug("---hello---")).toBe("hello");
    });
  });

  describe("getSlugSubdomain", () => {
    it("appends base domain", () => {
      expect(getSlugSubdomain("my-app")).toBe("my-app.prestige-build.dev");
    });
  });

  describe("normalizeDomain", () => {
    it("trims whitespace and lowercases", () => {
      expect(normalizeDomain("  Example.COM  ")).toBe("example.com");
    });
  });

  describe("getCnameTarget", () => {
    it("returns the CNAME target", () => {
      expect(getCnameTarget()).toBe("cname.prestige-build.dev");
    });
  });

  describe("isValidCustomDomain", () => {
    it("accepts valid domains", () => {
      expect(isValidCustomDomain("example.com")).toBe(true);
      expect(isValidCustomDomain("app.example.com")).toBe(true);
    });

    it("rejects domains ending with base domain", () => {
      expect(isValidCustomDomain("test.prestige-build.dev")).toBe(false);
    });

    it("rejects invalid domains", () => {
      expect(isValidCustomDomain("not a domain")).toBe(false);
      expect(isValidCustomDomain("")).toBe(false);
    });
  });
});
