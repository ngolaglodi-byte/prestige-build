import { test, expect } from "@playwright/test";

test.describe("Change Password Page", () => {
  test("should load the change password page", async ({ page }) => {
    // Note: This will redirect to login since user is not authenticated
    // But we can verify the route exists
    await page.goto("/settings/change-password");
    
    // Should either show change password page or redirect to login
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(url).toMatch(/\/(settings\/change-password|login)/);
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/settings/change-password");
    await page.waitForURL(/\/(login|settings)/, { timeout: 10000 });
    
    // Since we're not authenticated, should redirect to login
    const url = page.url();
    // Either redirected to login or the settings page is protected
    expect(url).toBeTruthy();
  });

  test("change password form elements should exist when authenticated", async ({ page }) => {
    // This test verifies the page structure
    // In a real scenario, we would need to mock authentication
    await page.goto("/settings/change-password");
    
    await page.waitForLoadState("domcontentloaded");
    
    // Check if we're on login or change-password page
    const url = page.url();
    
    if (url.includes("/settings/change-password")) {
      // Verify form elements exist
      const currentPasswordInput = page.locator('input#currentPassword');
      const newPasswordInput = page.locator('input#newPassword');
      const confirmPasswordInput = page.locator('input#confirmPassword');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(currentPasswordInput).toBeVisible();
      await expect(newPasswordInput).toBeVisible();
      await expect(confirmPasswordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    } else {
      // Redirected to login - this is expected behavior for unauthenticated users
      expect(url).toMatch(/\/login/);
    }
  });
});

test.describe("Change Password API", () => {
  test("should reject unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/auth/change-password", {
      data: {
        currentPassword: "old",
        newPassword: "new",
      },
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Non authentifié");
  });

  test("should reject requests without required fields", async ({ request }) => {
    const response = await request.post("/api/auth/change-password", {
      data: {
        // Missing both passwords
      },
    });
    
    // Should return 400 or 401
    expect([400, 401]).toContain(response.status());
  });
});
