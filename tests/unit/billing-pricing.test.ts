import { describe, it, expect } from "vitest";
import {
  CURRENCIES,
  detectCountryFromHeaders,
  detectCountryFromLocale,
  currencyForCountry,
  convertPrice,
  formatPrice,
  type FxRates,
} from "@/lib/billing/pricing";

describe("billing/pricing", () => {
  describe("CURRENCIES", () => {
    it("includes USD", () => {
      expect(CURRENCIES.USD).toBeDefined();
      expect(CURRENCIES.USD.symbol).toBe("$");
    });

    it("includes XOF", () => {
      expect(CURRENCIES.XOF).toBeDefined();
      expect(CURRENCIES.XOF.symbol).toBe("FCFA");
    });

    it("has all expected currencies", () => {
      const codes = Object.keys(CURRENCIES);
      expect(codes).toContain("USD");
      expect(codes).toContain("XOF");
      expect(codes).toContain("XAF");
      expect(codes).toContain("KES");
      expect(codes).toContain("NGN");
    });
  });

  describe("detectCountryFromHeaders", () => {
    it("detects country from Cloudflare header", () => {
      const headers = new Headers({ "cf-ipcountry": "CI" });
      expect(detectCountryFromHeaders(headers)).toBe("CI");
    });

    it("detects country from Vercel header", () => {
      const headers = new Headers({ "x-vercel-ip-country": "ke" });
      expect(detectCountryFromHeaders(headers)).toBe("KE");
    });

    it("returns null when no header present", () => {
      const headers = new Headers();
      expect(detectCountryFromHeaders(headers)).toBeNull();
    });

    it("ignores XX country from Cloudflare", () => {
      const headers = new Headers({ "cf-ipcountry": "XX" });
      expect(detectCountryFromHeaders(headers)).toBeNull();
    });
  });

  describe("detectCountryFromLocale", () => {
    it("detects country from fr-CD locale", () => {
      expect(detectCountryFromLocale("fr-CD")).toBe("CD");
    });

    it("detects country from en-US locale", () => {
      expect(detectCountryFromLocale("en-US")).toBe("US");
    });

    it("returns null for null input", () => {
      expect(detectCountryFromLocale(null)).toBeNull();
    });

    it("returns null for unknown locale", () => {
      expect(detectCountryFromLocale("de-DE")).toBeNull();
    });

    it("handles locale with quality values", () => {
      expect(detectCountryFromLocale("fr-CI;q=0.9,en-US;q=0.8")).toBe("CI");
    });
  });

  describe("currencyForCountry", () => {
    it("returns XOF for Côte d'Ivoire", () => {
      expect(currencyForCountry("CI")).toBe("XOF");
    });

    it("returns USD for null", () => {
      expect(currencyForCountry(null)).toBe("USD");
    });

    it("returns USD for unknown country", () => {
      expect(currencyForCountry("ZZ")).toBe("USD");
    });

    it("is case insensitive", () => {
      expect(currencyForCountry("ci")).toBe("XOF");
    });
  });

  describe("convertPrice", () => {
    const rates: FxRates = { USD: 1, XOF: 600, KES: 150, NGN: 1500 };

    it("returns USD price as-is", () => {
      expect(convertPrice(20, "USD", rates)).toBe(20);
    });

    it("converts to XOF with rounding", () => {
      const result = convertPrice(20, "XOF", rates);
      expect(result).toBe(12000);
    });

    it("converts to NGN with rounding", () => {
      const result = convertPrice(20, "NGN", rates);
      expect(result).toBe(30000);
    });
  });

  describe("formatPrice", () => {
    it("formats USD price", () => {
      const result = formatPrice(20, "USD");
      expect(result).toContain("$");
    });

    it("formats XOF price", () => {
      const result = formatPrice(12000, "XOF");
      expect(result).toContain("FCFA");
    });
  });
});
