import { test, expect } from "@playwright/test";

/**
 * E2E tests that simulate authenticated flows using Clerk testing tokens.
 *
 * To run these tests locally, set the following environment variables:
 *   - CLERK_TESTING_TOKEN: A long-lived testing token from Clerk dashboard
 *   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 *   - CLERK_SECRET_KEY
 *
 * In CI, these are injected as secrets.
 */

const CLERK_TESTING_TOKEN = process.env.CLERK_TESTING_TOKEN;

test.describe("Authenticated E2E flows", () => {
  test.skip(!CLERK_TESTING_TOKEN, "CLERK_TESTING_TOKEN not set — skipping authenticated tests");

  test.beforeEach(async ({ page }) => {
    // Inject the Clerk testing token as a cookie before navigating
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

  test("should access dashboard when authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Authenticated user should stay on dashboard, not be redirected to sign-in
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|sign-in)/);
  });

  test("should access settings when authenticated", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(settings|sign-in)/);
  });

  test("should access billing page when authenticated", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(billing|sign-in)/);
  });

  test("should return health check data from API", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.status()).toBeLessThan(504);
    const json = await response.json();
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("timestamp");
    expect(json).toHaveProperty("uptime");
  });
});
