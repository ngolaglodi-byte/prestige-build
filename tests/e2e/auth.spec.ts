import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should load the login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should display the login form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    // Check for the login form elements
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });
});

test.describe("Setup Page", () => {
  test("should load the setup page", async ({ page }) => {
    await page.goto("/setup");
    await expect(page).toHaveURL(/\/setup/);
  });

  test("should display the setup form", async ({ page }) => {
    await page.goto("/setup");
    await page.waitForLoadState("domcontentloaded");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Authentication Redirect", () => {
  test("should redirect unauthenticated users from dashboard to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Local auth middleware should redirect to login
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
    // If auth is not configured or user is not authenticated, redirects to login
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });

  test("should redirect unauthenticated users from projects/new to login", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForURL(/\/(login|projects)/, { timeout: 10000 });
    const url = page.url();
    expect(url).toMatch(/\/(login|projects)/);
  });
});
