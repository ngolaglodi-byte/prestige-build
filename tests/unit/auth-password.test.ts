/**
 * Unit tests for password handling functions.
 * Tests plaintext password validation and comparison.
 */
import { describe, it, expect } from "vitest";
import { validatePassword, hashPassword, verifyPassword, PASSWORD_POLICY } from "@/lib/auth/password";

describe("password", () => {
  describe("PASSWORD_POLICY", () => {
    it("should have simplified policy requirements", () => {
      expect(PASSWORD_POLICY.minLength).toBe(4);
      expect(PASSWORD_POLICY.maxLength).toBe(128);
      expect(PASSWORD_POLICY.requireUppercase).toBe(false);
      expect(PASSWORD_POLICY.requireLowercase).toBe(false);
      expect(PASSWORD_POLICY.requireNumber).toBe(false);
      expect(PASSWORD_POLICY.requireSpecial).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should reject empty password", () => {
      const result = validatePassword("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Le mot de passe est requis");
    });

    it("should reject password shorter than minimum length", () => {
      const result = validatePassword("abc"); // 3 chars, min is 4
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("au moins 4 caractères"))).toBe(true);
    });

    it("should accept password meeting minimum length", () => {
      const result = validatePassword("test"); // 4 chars, exactly minimum
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept password of any complexity", () => {
      // Simple password without uppercase, lowercase, numbers, or special chars
      const result = validatePassword("simple");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password exceeding maximum length", () => {
      const longPassword = "a".repeat(129); // 129 chars, max is 128
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("128 caractères"))).toBe(true);
    });

    it("should accept password at maximum length", () => {
      const maxPassword = "a".repeat(128); // exactly 128 chars
      const result = validatePassword(maxPassword);
      expect(result.valid).toBe(true);
    });
  });

  describe("hashPassword", () => {
    it("should return password unchanged (plaintext)", async () => {
      const password = "testPassword123";
      const result = await hashPassword(password);
      expect(result).toBe(password);
    });

    it("should handle empty string", async () => {
      const result = await hashPassword("");
      expect(result).toBe("");
    });

    it("should handle special characters", async () => {
      const password = "test@#$%^&*()";
      const result = await hashPassword(password);
      expect(result).toBe(password);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for matching passwords", async () => {
      const password = "testPassword";
      const storedPassword = "testPassword";
      const result = await verifyPassword(password, storedPassword);
      expect(result).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      const password = "testPassword";
      const storedPassword = "wrongPassword";
      const result = await verifyPassword(password, storedPassword);
      expect(result).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const password = "TestPassword";
      const storedPassword = "testpassword";
      const result = await verifyPassword(password, storedPassword);
      expect(result).toBe(false);
    });

    it("should handle empty passwords", async () => {
      const result = await verifyPassword("", "");
      expect(result).toBe(true);
    });

    it("should handle special characters", async () => {
      const password = "test@#$%^&*()!";
      const storedPassword = "test@#$%^&*()!";
      const result = await verifyPassword(password, storedPassword);
      expect(result).toBe(true);
    });
  });
});
