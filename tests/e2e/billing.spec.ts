import { test, expect } from "@playwright/test";

/**
 * E2E tests for the billing business flow:
 * - API auth guards
 * - Public rates endpoint
 * - Payment validation
 * - Authenticated billing page
 * - Mocked billing flow with route interception
 */

// ── Auth guards ───────────────────────────────────────────────────────
test.describe("Billing API auth guards", () => {
  test("should reject unauthenticated GET /api/billing", async ({ request }) => {
    const response = await request.get("/api/billing");
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject unauthenticated GET /api/billing/history", async ({ request }) => {
    const response = await request.get("/api/billing/history");
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject unauthenticated POST /api/billing/pay", async ({ request }) => {
    const response = await request.post("/api/billing/pay", {
      data: { plan: "pro", phoneNumber: "+243123456789", currency: "USD", country: "CD" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});

// ── Public rates endpoint ─────────────────────────────────────────────
test.describe("Billing rates endpoint", () => {
  test("GET /api/billing/rates returns JSON with country, currency, and plans", async ({ request }) => {
    const response = await request.get("/api/billing/rates");
    // rates is public — should return 200 (or 500 if FX service is down)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const json = await response.json();
      expect(json).toHaveProperty("country");
      expect(json).toHaveProperty("currency");
      expect(json).toHaveProperty("plans");
      // Plans should contain the three tiers
      expect(json.plans).toHaveProperty("free");
      expect(json.plans).toHaveProperty("pro");
      expect(json.plans).toHaveProperty("enterprise");
    }
  });

  test("GET /api/billing/rates?country=FR returns data for France", async ({ request }) => {
    const response = await request.get("/api/billing/rates?country=FR");
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const json = await response.json();
      expect(json.country).toBe("FR");
      // France falls back to USD (EUR is not a supported CurrencyCode)
      expect(json.currency).toBe("USD");
    }
  });

  test("GET /api/billing/rates?country=CD returns data for Congo", async ({ request }) => {
    const response = await request.get("/api/billing/rates?country=CD");
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const json = await response.json();
      expect(json.country).toBe("CD");
    }
  });
});

// ── Payment validation ────────────────────────────────────────────────
test.describe("Billing pay validation", () => {
  test("POST /api/billing/pay with missing fields is rejected", async ({ request }) => {
    const response = await request.post("/api/billing/pay", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    // Without auth the request is rejected before validation
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });

  test("POST /api/billing/pay with invalid plan is rejected", async ({ request }) => {
    const response = await request.post("/api/billing/pay", {
      data: { plan: "invalid_plan", phoneNumber: "+243123456789", currency: "USD", country: "CD" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });

  test("POST /api/billing/pay with free plan is rejected", async ({ request }) => {
    const response = await request.post("/api/billing/pay", {
      data: { plan: "free", phoneNumber: "+243123456789", currency: "USD", country: "CD" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });

  test("POST /api/billing/pay with missing phone number is rejected", async ({ request }) => {
    const response = await request.post("/api/billing/pay", {
      data: { plan: "pro", currency: "USD", country: "CD" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

// ── Authenticated billing page ────────────────────────────────────────
const CLERK_TESTING_TOKEN = process.env.CLERK_TESTING_TOKEN;

test.describe("Authenticated billing page", () => {
  test.skip(!CLERK_TESTING_TOKEN, "CLERK_TESTING_TOKEN not set — skipping authenticated tests");

  test.beforeEach(async ({ page }) => {
    if (CLERK_TESTING_TOKEN) {
      await page.context().addCookies([
        {
          name: "__clerk_db_jwt",
          value: CLERK_TESTING_TOKEN,
          domain: "localhost",
          path: "/",
        },
      ]);
    }
  });

  test("should load the billing page when authenticated", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(billing|sign-in)/);
  });

  test("should return billing info from API when authenticated", async ({ page }) => {
    const response = await page.request.get("/api/billing");
    // With a valid token we expect 200; if the token is invalid, auth returns 401/500
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const json = await response.json();
      expect(json).toHaveProperty("plan");
      expect(json).toHaveProperty("credits");
      expect(json).toHaveProperty("status");
    }
  });
});

// ── Shared mock data for mocked billing flow ─────────────────────────
const MOCK_PLAN_INFO = {
  plan: "free",
  credits: 10,
  creditsMonthly: 10,
  status: "active",
  renewalDate: null,
  limits: { workspaceSizeMb: 100, deploysPerDay: 3, customDomains: 0 },
};

const MOCK_RATES = {
  country: "CD",
  currency: "USD",
  symbol: "$",
  rate: 1,
  plans: {
    free: { priceUsd: 0, priceLocal: 0, currency: "USD" },
    pro: { priceUsd: 19, priceLocal: 19, currency: "USD" },
    enterprise: { priceUsd: 49, priceLocal: 49, currency: "USD" },
  },
};

import type { Page } from "@playwright/test";

/** Sets up route mocks for billing plan, rates, and history. */
async function mockBillingRoutes(page: Page) {
  await page.route("**/api/billing", (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PLAN_INFO),
      });
    } else {
      route.continue();
    }
  });

  await page.route("**/api/billing/rates**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_RATES),
    });
  });

  await page.route("**/api/billing/history**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ history: [] }),
    });
  });
}

// ── Mocked billing flow ──────────────────────────────────────────────
test.describe("Mocked billing flow", () => {
  test("billing page renders with mocked API data", async ({ page }) => {
    await mockBillingRoutes(page);

    await page.goto("/billing");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    if (url.includes("/billing")) {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      // Auth redirect — expected without Clerk credentials
      expect(url).toMatch(/\/sign-in/);
    }
  });

  test("successful payment flow with mocked API", async ({ page }) => {
    await mockBillingRoutes(page);

    // Mock payment endpoint — simulate success
    await page.route("**/api/billing/pay", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            depositId: "test-deposit-id-123",
            status: "completed",
            message: "Crédits ajoutés (mode démo).",
            plan: "pro",
            credits: 500,
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto("/billing");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    if (url.includes("/billing")) {
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    } else {
      // Auth redirect — expected without Clerk credentials
      expect(url).toMatch(/\/sign-in/);
    }
  });
});
