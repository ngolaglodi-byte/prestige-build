import { describe, it, expect, vi, beforeEach } from "vitest";

describe("API Billing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ---------- GET /api/billing ----------
  describe("GET /api/billing", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { GET } = await import("@/app/api/billing/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  // ---------- GET /api/billing/history ----------
  describe("GET /api/billing/history", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { GET } = await import("@/app/api/billing/history/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  // ---------- POST /api/billing/pay ----------
  describe("POST /api/billing/pay", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { POST } = await import("@/app/api/billing/pay/route");
      const req = new Request("http://localhost/api/billing/pay", {
        method: "POST",
        body: JSON.stringify({ plan: "pro", phoneNumber: "+243123456789" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects invalid plan", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { POST } = await import("@/app/api/billing/pay/route");
      const req = new Request("http://localhost/api/billing/pay", {
        method: "POST",
        body: JSON.stringify({ plan: "free", phoneNumber: "+243123456789" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Plan invalide");
    });

    it("rejects missing phoneNumber", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { POST } = await import("@/app/api/billing/pay/route");
      const req = new Request("http://localhost/api/billing/pay", {
        method: "POST",
        body: JSON.stringify({ plan: "pro" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("téléphone");
    });
  });

  // ---------- GET /api/billing/rates ----------
  describe("GET /api/billing/rates", () => {
    it("returns valid rates response", async () => {
      vi.doMock("@/lib/billing/pricing", () => ({
        detectCountryFromHeaders: vi.fn().mockReturnValue(null),
        detectCountryFromLocale: vi.fn().mockReturnValue(null),
        currencyForCountry: vi.fn().mockReturnValue("USD"),
        fetchFxRates: vi.fn().mockResolvedValue({ USD: 1, EUR: 0.92 }),
        convertPrice: vi.fn().mockImplementation((price: number) => price),
        CURRENCIES: {
          USD: { symbol: "$", name: "US Dollar" },
          EUR: { symbol: "€", name: "Euro" },
        },
      }));
      vi.doMock("@/lib/billing/plans", () => ({
        PLANS: {
          free: { priceUsd: 0 },
          pro: { priceUsd: 20 },
          enterprise: { priceUsd: 70 },
        },
      }));
      const { GET } = await import("@/app/api/billing/rates/route");
      const req = new Request("http://localhost/api/billing/rates");
      const response = await GET(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.country).toBeDefined();
      expect(body.currency).toBeDefined();
      expect(body.plans).toBeDefined();
      expect(body.plans.free).toBeDefined();
      expect(body.plans.pro).toBeDefined();
      expect(body.plans.enterprise).toBeDefined();
    });
  });
});
