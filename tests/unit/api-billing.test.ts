import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * API Billing tests are skipped because billing routes have not been implemented yet.
 * The billing functionality is documented in OpenAPI spec but not yet available.
 * TODO: Implement billing routes (/api/billing, /api/billing/history, /api/billing/pay, /api/billing/rates)
 */
describe.skip("API Billing (Not Implemented)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ---------- GET /api/billing ----------
  describe("GET /api/billing", () => {
    it.todo("rejects unauthenticated requests");
  });

  // ---------- GET /api/billing/history ----------
  describe("GET /api/billing/history", () => {
    it.todo("rejects unauthenticated requests");
  });

  // ---------- POST /api/billing/pay ----------
  describe("POST /api/billing/pay", () => {
    it.todo("rejects unauthenticated requests");
    it.todo("rejects invalid plan");
    it.todo("rejects missing phoneNumber");
  });

  // ---------- GET /api/billing/rates ----------
  describe("GET /api/billing/rates", () => {
    it.todo("returns valid rates response");
  });
});
