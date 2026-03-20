/**
 * Unit tests for email format validation and generation.
 * Tests the PTC company email format: initial.nom@ptc.com
 */
import { describe, it, expect } from "vitest";
import { validateEmailFormat, generateEmailFromName, normalizeEmail } from "@/lib/auth/service";

describe("email format", () => {
  describe("validateEmailFormat", () => {
    it("should accept valid PTC email format", () => {
      expect(validateEmailFormat("g.ngola@ptc.com")).toBe(true);
      expect(validateEmailFormat("p.build@ptc.com")).toBe(true);
      expect(validateEmailFormat("a.test@ptc.com")).toBe(true);
      expect(validateEmailFormat("j.dupont@ptc.com")).toBe(true);
    });

    it("should accept uppercase variants (normalized to lowercase)", () => {
      expect(validateEmailFormat("G.NGOLA@PTC.COM")).toBe(true);
      expect(validateEmailFormat("G.Ngola@Ptc.Com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      // Multiple initials
      expect(validateEmailFormat("gl.ngola@ptc.com")).toBe(false);
      // Missing dot
      expect(validateEmailFormat("gngola@ptc.com")).toBe(false);
      // Wrong domain
      expect(validateEmailFormat("g.ngola@otc.com")).toBe(false);
      expect(validateEmailFormat("g.ngola@gmail.com")).toBe(false);
      // Missing initial
      expect(validateEmailFormat(".ngola@ptc.com")).toBe(false);
      // Empty name
      expect(validateEmailFormat("g.@ptc.com")).toBe(false);
      // Extra dots
      expect(validateEmailFormat("g.ngola.extra@ptc.com")).toBe(false);
    });

    it("should reject empty or null input", () => {
      expect(validateEmailFormat("")).toBe(false);
    });
  });

  describe("generateEmailFromName", () => {
    it("should generate correct email from full name", () => {
      expect(generateEmailFromName("Glodi Ngola")).toBe("g.ngola@ptc.com");
      expect(generateEmailFromName("Prestige Build")).toBe("p.build@ptc.com");
      expect(generateEmailFromName("Jean Dupont")).toBe("j.dupont@ptc.com");
    });

    it("should handle names with extra spaces", () => {
      expect(generateEmailFromName("  Glodi  Ngola  ")).toBe("g.ngola@ptc.com");
      expect(generateEmailFromName("Jean   Dupont")).toBe("j.dupont@ptc.com");
    });

    it("should use last name for compound names", () => {
      expect(generateEmailFromName("Jean Pierre Dupont")).toBe("j.dupont@ptc.com");
      expect(generateEmailFromName("Marie Claire Martin")).toBe("m.martin@ptc.com");
    });

    it("should handle accented characters", () => {
      expect(generateEmailFromName("José García")).toBe("j.garcia@ptc.com");
      expect(generateEmailFromName("François Müller")).toBe("f.muller@ptc.com");
      expect(generateEmailFromName("André Côté")).toBe("a.cote@ptc.com");
    });

    it("should throw error for single name", () => {
      expect(() => generateEmailFromName("Glodi")).toThrow("Le nom complet doit contenir au moins un prénom et un nom");
    });

    it("should throw error for empty input", () => {
      expect(() => generateEmailFromName("")).toThrow("Le nom complet doit contenir au moins un prénom et un nom");
      expect(() => generateEmailFromName("   ")).toThrow("Le nom complet doit contenir au moins un prénom et un nom");
    });
  });

  describe("normalizeEmail", () => {
    it("should return valid email as-is (lowercased)", () => {
      expect(normalizeEmail("g.ngola@ptc.com")).toBe("g.ngola@ptc.com");
      expect(normalizeEmail("G.NGOLA@PTC.COM")).toBe("g.ngola@ptc.com");
    });

    it("should trim whitespace", () => {
      expect(normalizeEmail("  g.ngola@ptc.com  ")).toBe("g.ngola@ptc.com");
    });

    it("should generate email from name if no @ present", () => {
      expect(normalizeEmail("Glodi Ngola")).toBe("g.ngola@ptc.com");
    });

    it("should return invalid email as-is (for validation to catch)", () => {
      expect(normalizeEmail("invalid@gmail.com")).toBe("invalid@gmail.com");
    });
  });
});
