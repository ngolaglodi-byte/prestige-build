import { test, expect, Page } from "@playwright/test";

/** Helper to dismiss the onboarding modal by setting localStorage flag and reloading. */
async function dismissOnboardingModal(page: Page) {
  await page.evaluate(() => localStorage.setItem("prestige_onboarding_done", "true"));
  await page.goto("/");
}

test.describe("Homepage", () => {
  test("should load the homepage with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Prestige Build/);
  });

  test("should display the hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("h1");
    await expect(hero).toContainText("Prestige Build");
  });

  test("should have login and setup links", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator('a[href="/login"]').first();
    const setupLink = page.locator('a[href="/setup"]').first();
    await expect(loginLink).toBeVisible();
    await expect(setupLink).toBeVisible();
  });

  test("should have navigation links to key sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="#features"]').first()).toBeVisible();
    await expect(page.locator('a[href="#pricing"]').first()).toBeVisible();
    await expect(page.locator('a[href="#integrations"]').first()).toBeVisible();
  });

  test("should display pricing section with plans", async ({ page }) => {
    await page.goto("/");
    const pricing = page.locator("#pricing");
    await expect(pricing).toBeVisible();
    await expect(pricing).toContainText("Gratuit");
    await expect(pricing).toContainText("Pro");
    await expect(pricing).toContainText("Enterprise");
  });

  test("should navigate to setup page when clicking setup button", async ({ page }) => {
    await page.goto("/");
    await dismissOnboardingModal(page);
    const setupLink = page.locator('a[href="/setup"]').first();
    await setupLink.click();
    await expect(page).toHaveURL(/\/setup/);
  });

  test("should navigate to login page when clicking login button", async ({ page }) => {
    await page.goto("/");
    await dismissOnboardingModal(page);
    const loginLink = page.locator('a[href="/login"]').first();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
