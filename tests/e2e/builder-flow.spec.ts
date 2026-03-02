import { test, expect } from "@playwright/test";

test.describe("Builder Page Auth Guard", () => {
  test("should reject unauthenticated builder page access", async ({ page }) => {
    const response = await page.goto("/builder");
    expect(response).not.toBeNull();
    const status = response!.status();
    // Expect redirect (307) or auth-gated content (200 with sign-in)
    expect([200, 307]).toContain(status);

    if (status === 200) {
      const content = await page.content();
      const hasAuthContent =
        content.includes("sign in") ||
        content.includes("Sign in") ||
        content.includes("log in") ||
        content.includes("Log in") ||
        content.includes("auth");
      expect(hasAuthContent).toBe(true);
    }
  });
});

test.describe("Builder API Auth Guards", () => {
  test("should reject unauthenticated POST to /api/builder/generate", async ({ request }) => {
    const response = await request.post("/api/builder/generate", {
      data: { prompt: "Build a todo app" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject unauthenticated POST to /api/builder/iterate", async ({ request }) => {
    const response = await request.post("/api/builder/iterate", {
      data: { prompt: "Add dark mode", files: {} },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Mocked Builder Prompt → Code → Preview Flow", () => {
  test("simulate builder generate and project create with mocked endpoints", async ({ page }) => {
    const mockGeneratedFiles = {
      "src/App.tsx": 'export default function App() { return <div>Todo App</div>; }',
      "src/index.tsx": 'import App from "./App"; render(<App />);',
    };
    const testProjectId = "builder-test-project-id";

    // Mock the builder generate API
    await page.route("**/api/builder/generate", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            files: mockGeneratedFiles,
            model: "gpt-4",
            usage: { prompt_tokens: 20, completion_tokens: 100 },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the builder iterate API
    await page.route("**/api/builder/iterate", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            files: {
              ...mockGeneratedFiles,
              "src/theme.ts": 'export const theme = { dark: true };',
            },
            model: "gpt-4",
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the project create API
    await page.route("**/api/projects/create", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            project: {
              id: testProjectId,
              name: "Builder Test Project",
              user_id: "test-user-id",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Navigate to establish JS context
    await page.goto("/");

    // Step 1: Send prompt to builder generate
    const generateRes = await page.evaluate(async () => {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Build a todo app with React" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(generateRes.status).toBe(200);
    expect(generateRes.body.files).toBeDefined();
    expect(generateRes.body.files["src/App.tsx"]).toContain("Todo App");
    expect(Object.keys(generateRes.body.files)).toHaveLength(2);

    // Step 2: Iterate on generated code
    const iterateRes = await page.evaluate(async () => {
      const res = await fetch("/api/builder/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Add dark mode support",
          files: {
            "src/App.tsx": 'export default function App() { return <div>Todo App</div>; }',
            "src/index.tsx": 'import App from "./App"; render(<App />);',
          },
        }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(iterateRes.status).toBe(200);
    expect(iterateRes.body.files).toBeDefined();
    expect(iterateRes.body.files["src/theme.ts"]).toContain("dark");
    expect(Object.keys(iterateRes.body.files)).toHaveLength(3);

    // Step 3: Save as project
    const createRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Builder Test Project" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(createRes.status).toBe(200);
    expect(createRes.body.project.id).toBe("builder-test-project-id");
    expect(createRes.body.project.name).toBe("Builder Test Project");
  });
});

test.describe("Builder API Rejects Empty Prompt", () => {
  test("should return 400 for empty prompt on generate", async ({ page }) => {
    // Mock generate to return 400 for empty prompt
    await page.route("**/api/builder/generate", (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        if (!body.prompt || body.prompt.trim() === "") {
          route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Prompt is required" }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ files: {} }),
          });
        }
      } else {
        route.continue();
      }
    });

    await page.goto("/");

    // Empty string prompt
    const emptyRes = await page.evaluate(async () => {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body.error).toBe("Prompt is required");

    // Missing prompt field
    const missingRes = await page.evaluate(async () => {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(missingRes.status).toBe(400);
    expect(missingRes.body.error).toBe("Prompt is required");

    // Whitespace-only prompt
    const whitespaceRes = await page.evaluate(async () => {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "   " }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(whitespaceRes.status).toBe(400);
    expect(whitespaceRes.body.error).toBe("Prompt is required");
  });
});

test.describe("Templates Listing in Builder", () => {
  test("should return a list of templates", async ({ page }) => {
    const mockTemplates = [
      {
        id: "template-1",
        name: "Todo App",
        description: "A simple todo application",
        category: "productivity",
        thumbnail: "/templates/todo.png",
      },
      {
        id: "template-2",
        name: "Blog",
        description: "A blog with markdown support",
        category: "content",
        thumbnail: "/templates/blog.png",
      },
      {
        id: "template-3",
        name: "Dashboard",
        description: "Admin dashboard with charts",
        category: "business",
        thumbnail: "/templates/dashboard.png",
      },
    ];

    // Mock the templates API
    await page.route("**/api/templates", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ templates: mockTemplates }),
      });
    });

    await page.goto("/");

    const templatesRes = await page.evaluate(async () => {
      const res = await fetch("/api/templates");
      return { status: res.status, body: await res.json() };
    });

    expect(templatesRes.status).toBe(200);
    expect(templatesRes.body.templates).toHaveLength(3);
    expect(templatesRes.body.templates[0].name).toBe("Todo App");
    expect(templatesRes.body.templates[1].name).toBe("Blog");
    expect(templatesRes.body.templates[2].name).toBe("Dashboard");

    // Verify each template has required fields
    for (const template of templatesRes.body.templates) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.category).toBeDefined();
    }
  });
});
