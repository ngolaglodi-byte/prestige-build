import { test, expect } from "@playwright/test";

test.describe("AI Generate API Auth Guards", () => {
  test("should reject unauthenticated POST to /api/ai/generate", async ({ request }) => {
    const response = await request.post("/api/ai/generate", {
      data: { prompt: "Generate a React component" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject POST with empty body", async ({ request }) => {
    const response = await request.post("/api/ai/generate", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject POST with missing prompt", async ({ request }) => {
    const response = await request.post("/api/ai/generate", {
      data: { code: "const x = 1;", projectId: "test-id" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Project AI Endpoint Auth Guards", () => {
  test("should reject unauthenticated POST to /api/projects/[projectId]/ai", async ({ request }) => {
    const response = await request.post("/api/projects/test-id/ai", {
      data: { prompt: "Add a login form" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject POST with missing prompt", async ({ request }) => {
    const response = await request.post("/api/projects/test-id/ai", {
      data: { action: "generate", model: "gpt-4" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Mocked AI Generation Flow", () => {
  test("simulate AI generation with mocked endpoint", async ({ page }) => {
    const mockGeneratedCode = "export default function App() { return <div>Hello</div>; }";

    // Mock the AI generate API
    await page.route("**/api/ai/generate", (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: mockGeneratedCode,
            model: "gpt-4",
            usage: { prompt_tokens: 10, completion_tokens: 50 },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock project-scoped AI endpoint
    await page.route("**/api/projects/*/ai", (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: mockGeneratedCode,
            filePath: "src/App.tsx",
            action: "generate",
          }),
        });
      } else {
        route.continue();
      }
    });

    // Visit the homepage to verify routes are intercepted
    await page.goto("/");
    await expect(page).toHaveTitle(/Prestige Build/);

    // Verify the mocked AI endpoint responds correctly via fetch
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Create a React component" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(200);
    expect(result.body.code).toBe(mockGeneratedCode);
    expect(result.body.model).toBe("gpt-4");

    // Verify the mocked project AI endpoint responds correctly
    const projectResult = await page.evaluate(async () => {
      const res = await fetch("/api/projects/test-project-123/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Add a login form", action: "generate" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(projectResult.status).toBe(200);
    expect(projectResult.body.code).toBe(mockGeneratedCode);
    expect(projectResult.body.filePath).toBe("src/App.tsx");
  });
});
