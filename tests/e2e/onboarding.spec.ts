import { test, expect } from "@playwright/test";

test.describe("Onboarding Modal", () => {
  test("should render onboarding modal on first visit", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("prestige_onboarding_done"));
    await page.goto("/");

    const welcome = page.locator("text=Bienvenue sur Prestige Build");
    await expect(welcome).toBeVisible({ timeout: 5000 });
  });

  test("should be skippable via Passer button", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("prestige_onboarding_done"));
    await page.goto("/");

    const skipButton = page.locator("button", { hasText: "Passer" });
    await expect(skipButton).toBeVisible({ timeout: 5000 });
    await skipButton.click();

    const welcome = page.locator("text=Bienvenue sur Prestige Build");
    await expect(welcome).toBeHidden({ timeout: 5000 });
  });

  test("should navigate between steps with Suivant and Précédent", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("prestige_onboarding_done"));
    await page.goto("/");

    // Step 1 visible
    await expect(page.locator("text=Bienvenue sur Prestige Build")).toBeVisible({ timeout: 5000 });

    // Advance to step 2
    await page.locator("button", { hasText: "Suivant" }).click();
    await expect(page.locator("text=Créez votre premier projet")).toBeVisible({ timeout: 5000 });

    // Advance to step 3
    await page.locator("button", { hasText: "Suivant" }).click();
    await expect(page.locator("text=Générez du code avec l'IA")).toBeVisible({ timeout: 5000 });

    // Go back to step 2
    await page.locator("button", { hasText: "Précédent" }).click();
    await expect(page.locator("text=Créez votre premier projet")).toBeVisible({ timeout: 5000 });
  });

  test("should not show onboarding modal after completion", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("prestige_onboarding_done", "true"));
    await page.goto("/");

    const welcome = page.locator("text=Bienvenue sur Prestige Build");
    await expect(welcome).toBeHidden({ timeout: 5000 });
  });

  test("should show Commencer button on last step linking to /projects", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("prestige_onboarding_done"));
    await page.goto("/");

    // Navigate through all steps to reach the last one
    for (let i = 0; i < 5; i++) {
      await page.locator("button", { hasText: "Suivant" }).click();
    }

    // Use a more specific selector targeting the onboarding modal's "Commencer" link
    const modal = page.locator('[class*="fixed"][class*="z-[100]"]');
    const commencer = modal.locator('a[href="/projects"]', { hasText: "Commencer" });
    await expect(commencer).toBeVisible({ timeout: 5000 });
    await expect(commencer).toHaveAttribute("href", "/projects");
  });
});
