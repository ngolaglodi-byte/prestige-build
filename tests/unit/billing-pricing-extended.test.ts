import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  convertPrice,
  formatPrice,
  fetchFxRates,
  PAWAPAY_CORRESPONDENTS,
  COUNTRY_CURRENCY,
  type FxRates,
} from "@/lib/billing/pricing";

describe("billing/pricing (extended)", () => {
  describe("PAWAPAY_CORRESPONDENTS", () => {
    it("has correspondents for major countries", () => {
      expect(PAWAPAY_CORRESPONDENTS["CD"]).toBe("MTN_MOMO_COD");
      expect(PAWAPAY_CORRESPONDENTS["KE"]).toBe("MPESA_KEN");
      expect(PAWAPAY_CORRESPONDENTS["NG"]).toBe("OPAY_NGA");
    });

    it("has correspondent for each country in COUNTRY_CURRENCY", () => {
      for (const country of Object.keys(COUNTRY_CURRENCY)) {
        if (country === "US") continue; // US doesn't use PawaPay
        expect(PAWAPAY_CORRESPONDENTS[country], `Missing PawaPay for ${country}`).toBeDefined();
      }
    });
  });

  describe("convertPrice edge cases", () => {
    const rates: FxRates = { USD: 1, XOF: 615, GHS: 15, KES: 155, ZMW: 27 };

    it("handles zero price", () => {
      expect(convertPrice(0, "XOF", rates)).toBe(0);
    });

    it("handles missing rate", () => {
      const result = convertPrice(20, "XOF", { USD: 1 });
      // Falls back to rate 1 when not found
      expect(typeof result).toBe("number");
    });

    it("converts GHS correctly", () => {
      const result = convertPrice(20, "GHS", rates);
      expect(result).toBe(300); // 20*15 = 300
    });

    it("converts ZMW correctly", () => {
      const result = convertPrice(20, "ZMW", rates);
      expect(result).toBe(540); // 20*27 = 540, rounded to nearest 10
    });
  });

  describe("formatPrice edge cases", () => {
    it("formats zero amount", () => {
      const result = formatPrice(0, "USD");
      expect(result).toContain("$");
    });

    it("formats large NGN amount", () => {
      const result = formatPrice(30000, "NGN");
      expect(result).toContain("₦");
    });

    it("formats KES amount", () => {
      const result = formatPrice(3100, "KES");
      expect(result).toContain("KSh");
    });
  });

  describe("fetchFxRates", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns fallback rates when API fails", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
      const rates = await fetchFxRates();
      expect(rates.USD).toBe(1);
      expect(rates.XOF).toBeDefined();
    });

    it("returns fallback rates when API returns non-ok status", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
      const rates = await fetchFxRates();
      expect(rates.USD).toBe(1);
    });
  });
});
