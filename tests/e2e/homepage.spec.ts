import { test, expect } from "@playwright/test";

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

  test("should have sign-in and sign-up links", async ({ page }) => {
    await page.goto("/");
    const signInLink = page.locator('a[href="/sign-in"]').first();
    const signUpLink = page.locator('a[href="/sign-up"]').first();
    await expect(signInLink).toBeVisible();
    await expect(signUpLink).toBeVisible();
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

  test("should navigate to sign-up page when clicking sign-up button", async ({ page }) => {
    await page.goto("/");
    const signUpLink = page.locator('a[href="/sign-up"]').first();
    await signUpLink.click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("should navigate to sign-in page when clicking sign-in button", async ({ page }) => {
    await page.goto("/");
    const signInLink = page.locator('a[href="/sign-in"]').first();
    await signInLink.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
