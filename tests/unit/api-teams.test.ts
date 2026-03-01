import { describe, it, expect, vi, beforeEach } from "vitest";

function mockDbWithUser() {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([
      { id: "user_1", email: "test@test.com", name: "Test User", clerkId: "clerk_123" },
    ]),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  };
  return { select: vi.fn().mockReturnValue(chain) };
}

describe("API Teams", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ---------- GET /api/teams ----------
  describe("GET /api/teams", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { GET } = await import("@/app/api/teams/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  // ---------- POST /api/teams/create ----------
  describe("POST /api/teams/create", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { POST } = await import("@/app/api/teams/create/route");
      const req = new Request("http://localhost/api/teams/create", {
        method: "POST",
        body: JSON.stringify({ name: "Team A" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects empty name", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      vi.doMock("@/db/client", () => ({ db: mockDbWithUser() }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn() }));
      vi.doMock("@/db/schema", () => ({
        users: {}, teams: {}, teamMembers: {},
      }));
      const { POST } = await import("@/app/api/teams/create/route");
      const req = new Request("http://localhost/api/teams/create", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("rejects missing name", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      vi.doMock("@/db/client", () => ({ db: mockDbWithUser() }));
      vi.doMock("drizzle-orm", () => ({ eq: vi.fn() }));
      vi.doMock("@/db/schema", () => ({
        users: {}, teams: {}, teamMembers: {},
      }));
      const { POST } = await import("@/app/api/teams/create/route");
      const req = new Request("http://localhost/api/teams/create", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });
  });

  // ---------- POST /api/teams/invite ----------
  describe("POST /api/teams/invite", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { POST } = await import("@/app/api/teams/invite/route");
      const req = new Request("http://localhost/api/teams/invite", {
        method: "POST",
        body: JSON.stringify({ teamId: "t1", email: "a@b.com" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });
  });

  // ---------- POST /api/teams/accept ----------
  describe("POST /api/teams/accept", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/db/client", () => ({ db: {} }));
      const { POST } = await import("@/app/api/teams/accept/route");
      const req = new Request("http://localhost/api/teams/accept", {
        method: "POST",
        body: JSON.stringify({ memberId: "m1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });
  });
});
