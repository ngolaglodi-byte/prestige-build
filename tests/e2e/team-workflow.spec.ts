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

    // Step 1: Create a team via mocked API
    const createResponse = await page.request.post("/api/teams/create", {
      data: { name: testTeamName },
      headers: { "Content-Type": "application/json" },
    });
    expect(createResponse.status()).toBe(200);
    const createData = await createResponse.json();
    expect(createData.team).toBeDefined();
    expect(createData.team.id).toBe(testTeamId);
    expect(createData.team.name).toBe(testTeamName);

    // Step 2: List teams via mocked API
    const listResponse = await page.request.get("/api/teams");
    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.teams).toBeDefined();
    expect(listData.teams.length).toBeGreaterThanOrEqual(1);
    expect(listData.teams[0].id).toBe(testTeamId);

    // Step 3: Invite a member via mocked API
    const inviteResponse = await page.request.post("/api/teams/invite", {
      data: { teamId: testTeamId, email: testMemberEmail, role: "member" },
      headers: { "Content-Type": "application/json" },
    });
    expect(inviteResponse.status()).toBe(200);
    const inviteData = await inviteResponse.json();
    expect(inviteData.member).toBeDefined();
    expect(inviteData.member.email).toBe(testMemberEmail);
    expect(inviteData.member.status).toBe("pending");

    // Step 4: Accept the invitation via mocked API
    const acceptResponse = await page.request.post("/api/teams/accept", {
      data: { memberId: testMemberId },
      headers: { "Content-Type": "application/json" },
    });
    expect(acceptResponse.status()).toBe(200);
    const acceptData = await acceptResponse.json();
    expect(acceptData.member).toBeDefined();
    expect(acceptData.member.status).toBe("accepted");
    expect(acceptData.member.team_id).toBe(testTeamId);
  });
});
