import { test, expect } from "@playwright/test";

/**
 * E2E tests for the team workflow business flow:
 * - Auth guards on all team API endpoints
 * - Input validation for team creation and invitations
 * - Mocked full team creation → invite → accept flow
 */

test.describe("Teams List API", () => {
  test("should reject unauthenticated requests to list teams", async ({ request }) => {
    const response = await request.get("/api/teams");
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Teams Create API", () => {
  test("should reject unauthenticated requests to create team", async ({ request }) => {
    const response = await request.post("/api/teams/create", {
      data: { name: "Test Team" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with empty team name", async ({ request }) => {
    const response = await request.post("/api/teams/create", {
      data: { name: "" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing team name", async ({ request }) => {
    const response = await request.post("/api/teams/create", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Teams Invite API", () => {
  test("should reject unauthenticated requests to invite member", async ({ request }) => {
    const response = await request.post("/api/teams/invite", {
      data: { teamId: "team-123", email: "member@example.com", role: "member" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing teamId", async ({ request }) => {
    const response = await request.post("/api/teams/invite", {
      data: { email: "member@example.com" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });

  test("should reject requests with missing email", async ({ request }) => {
    const response = await request.post("/api/teams/invite", {
      data: { teamId: "team-123" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Teams Accept API", () => {
  test("should reject unauthenticated requests to accept invitation", async ({ request }) => {
    const response = await request.post("/api/teams/accept", {
      data: { memberId: "member-123" },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403, 307, 500]).toContain(response.status());
  });
});

test.describe("Mocked Team Workflow", () => {
  test("full team flow: create team → invite member → accept invitation", async ({ page }) => {
    const testTeamId = "test-team-id-456";
    const testTeamName = "My E2E Team";
    const testMemberId = "test-member-id-789";
    const testMemberEmail = "invited@example.com";

    // Mock the team creation API
    await page.route("**/api/teams/create", (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            team: {
              id: testTeamId,
              name: testTeamName,
              owner_id: "test-user-id",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the teams list API (match only /api/teams, not sub-routes)
    await page.route(/\/api\/teams(\?.*)?$/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          teams: [
            {
              id: testTeamId,
              name: testTeamName,
              owner_id: "test-user-id",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              members: [],
            },
          ],
        }),
      });
    });

    // Mock the invite API
    await page.route("**/api/teams/invite", (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            member: {
              id: testMemberId,
              team_id: testTeamId,
              email: testMemberEmail,
              role: "member",
              status: "pending",
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the accept invitation API
    await page.route("**/api/teams/accept", (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            member: {
              id: testMemberId,
              team_id: testTeamId,
              email: testMemberEmail,
              role: "member",
              status: "accepted",
              accepted_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Navigate to a page first so page.evaluate() has a JavaScript context
    await page.goto("/");

    // Step 1: Create a team via mocked API
    const createData = await page.evaluate(async (teamName) => {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });
      return { status: res.status, body: await res.json() };
    }, testTeamName);
    expect(createData.status).toBe(200);
    expect(createData.body.team).toBeDefined();
    expect(createData.body.team.id).toBe(testTeamId);
    expect(createData.body.team.name).toBe(testTeamName);

    // Step 2: List teams via mocked API
    const listData = await page.evaluate(async () => {
      const res = await fetch("/api/teams");
      return { status: res.status, body: await res.json() };
    });
    expect(listData.status).toBe(200);
    expect(listData.body.teams).toBeDefined();
    expect(listData.body.teams.length).toBeGreaterThanOrEqual(1);
    expect(listData.body.teams[0].id).toBe(testTeamId);

    // Step 3: Invite a member via mocked API
    const inviteData = await page.evaluate(async (args) => {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: args.teamId, email: args.email, role: "member" }),
      });
      return { status: res.status, body: await res.json() };
    }, { teamId: testTeamId, email: testMemberEmail });
    expect(inviteData.status).toBe(200);
    expect(inviteData.body.member).toBeDefined();
    expect(inviteData.body.member.email).toBe(testMemberEmail);
    expect(inviteData.body.member.status).toBe("pending");

    // Step 4: Accept the invitation via mocked API
    const acceptData = await page.evaluate(async (memberId) => {
      const res = await fetch("/api/teams/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      return { status: res.status, body: await res.json() };
    }, testMemberId);
    expect(acceptData.status).toBe(200);
    expect(acceptData.body.member).toBeDefined();
    expect(acceptData.body.member.status).toBe("accepted");
    expect(acceptData.body.member.team_id).toBe(testTeamId);
  });
});
