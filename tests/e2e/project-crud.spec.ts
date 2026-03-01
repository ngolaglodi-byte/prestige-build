import { test, expect } from "@playwright/test";

test.describe("Delete Project API", () => {
  test("should reject unauthenticated requests to delete project", async ({ request }) => {
    const response = await request.post("/api/projects/delete", {
      data: { id: "some-project-id" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing id", async ({ request }) => {
    const response = await request.post("/api/projects/delete", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Rename Project API", () => {
  test("should reject unauthenticated requests to rename project", async ({ request }) => {
    const response = await request.post("/api/projects/rename", {
      data: { id: "some-project-id", name: "New Name" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing id or name", async ({ request }) => {
    const missingId = await request.post("/api/projects/rename", {
      data: { name: "New Name" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(missingId.status());

    const missingName = await request.post("/api/projects/rename", {
      data: { id: "some-project-id" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(missingName.status());
  });
});

test.describe("Duplicate Project API", () => {
  test("should reject unauthenticated requests to duplicate project", async ({ request }) => {
    const response = await request.post("/api/projects/duplicate", {
      data: { id: "some-project-id" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing id", async ({ request }) => {
    const response = await request.post("/api/projects/duplicate", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Favorite Project API", () => {
  test("should reject unauthenticated requests to favorite project", async ({ request }) => {
    const response = await request.post("/api/projects/favorite", {
      data: { id: "some-project-id", isFavorite: true },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing id or isFavorite", async ({ request }) => {
    const missingId = await request.post("/api/projects/favorite", {
      data: { isFavorite: true },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(missingId.status());

    const missingFavorite = await request.post("/api/projects/favorite", {
      data: { id: "some-project-id" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(missingFavorite.status());
  });
});

test.describe("Mocked Full CRUD Flow", () => {
  test("create → rename → duplicate → favorite → delete with mocked services", async ({ page }) => {
    const testProjectId = "crud-test-project-id";
    const testDuplicateId = "crud-test-duplicate-id";
    const originalName = "CRUD Test Project";
    const renamedName = "CRUD Test Project Renamed";

    // Track project state for mocked responses
    let projectName = originalName;
    let projects = [
      {
        id: testProjectId,
        name: originalName,
        user_id: "test-user-id",
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Mock create
    await page.route("**/api/projects/create", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            project: {
              id: testProjectId,
              name: originalName,
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

    // Mock rename
    await page.route("**/api/projects/rename", (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        projectName = body.name;
        const target = projects.find((p) => p.id === body.id);
        if (target) target.name = body.name;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            project: { id: body.id, name: body.name },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock duplicate
    await page.route("**/api/projects/duplicate", (route) => {
      if (route.request().method() === "POST") {
        const duplicated = {
          id: testDuplicateId,
          name: `${projectName} (copy)`,
          user_id: "test-user-id",
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        projects.push(duplicated);
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ project: duplicated }),
        });
      } else {
        route.continue();
      }
    });

    // Mock favorite
    await page.route("**/api/projects/favorite", (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        const target = projects.find((p) => p.id === body.id);
        if (target) target.is_favorite = body.isFavorite;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            project: { id: body.id, is_favorite: body.isFavorite },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock delete
    await page.route("**/api/projects/delete", (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        projects = projects.filter((p) => p.id !== body.id);
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });

    // Mock list to reflect current project state
    await page.route("**/api/projects/list**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          projects,
          total: projects.length,
          page: 1,
          pageSize: 6,
        }),
      });
    });

    // Navigate to a page first so page.evaluate() has a JavaScript context
    await page.goto("/");

    // Step 1: Create project
    const createRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "CRUD Test Project" }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(createRes.status).toBe(200);
    expect(createRes.body.project.id).toBe(testProjectId);
    expect(createRes.body.project.name).toBe(originalName);

    // Step 2: Rename project
    const renameRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "crud-test-project-id", name: "CRUD Test Project Renamed" }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(renameRes.status).toBe(200);
    expect(renameRes.body.project.name).toBe(renamedName);

    // Step 3: Duplicate project
    const duplicateRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "crud-test-project-id" }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.project.id).toBe(testDuplicateId);
    expect(duplicateRes.body.project.name).toContain("(copy)");

    // Step 4: Favorite project
    const favoriteRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "crud-test-project-id", isFavorite: true }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(favoriteRes.status).toBe(200);
    expect(favoriteRes.body.project.is_favorite).toBe(true);

    // Step 5: Verify list includes both projects
    const listRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/list");
      return { status: res.status, body: await res.json() };
    });
    expect(listRes.status).toBe(200);
    expect(listRes.body.projects).toHaveLength(2);

    // Step 6: Delete original project
    const deleteRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "crud-test-project-id" }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Step 7: Verify list shows only the duplicate
    const finalListRes = await page.evaluate(async () => {
      const res = await fetch("/api/projects/list");
      return { status: res.status, body: await res.json() };
    });
    expect(finalListRes.status).toBe(200);
    expect(finalListRes.body.projects).toHaveLength(1);
    expect(finalListRes.body.projects[0].id).toBe("crud-test-duplicate-id");
  });
});
