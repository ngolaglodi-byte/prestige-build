import { describe, it, expect, vi, beforeEach } from "vitest";

describe("API Projects CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ---------- POST /api/projects/create ----------
  describe("POST /api/projects/create", () => {
    function setupMocks(userId: string | null) {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId }),
      }));
      vi.doMock("@/lib/supabase", () => ({
        getSupabaseServiceClient: vi.fn(),
      }));
      vi.doMock("@/lib/ensure-user", () => ({
        ensureUserExists: vi.fn(),
      }));
    }

    it("rejects unauthenticated requests", async () => {
      setupMocks(null);
      const { POST } = await import("@/app/api/projects/create/route");
      const req = new Request("http://localhost/api/projects/create", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("rejects empty name", async () => {
      setupMocks("clerk_123");
      const { POST } = await import("@/app/api/projects/create/route");
      const req = new Request("http://localhost/api/projects/create", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Project name is required");
    });

    it("rejects missing name", async () => {
      setupMocks("clerk_123");
      const { POST } = await import("@/app/api/projects/create/route");
      const req = new Request("http://localhost/api/projects/create", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Project name is required");
    });
  });

  // ---------- POST /api/projects/delete ----------
  describe("POST /api/projects/delete", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      const { POST } = await import("@/app/api/projects/delete/route");
      const req = new Request("http://localhost/api/projects/delete", {
        method: "POST",
        body: JSON.stringify({ id: "abc" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects missing id", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      const { POST } = await import("@/app/api/projects/delete/route");
      const req = new Request("http://localhost/api/projects/delete", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing id");
    });
  });

  // ---------- POST /api/projects/rename ----------
  describe("POST /api/projects/rename", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      const { POST } = await import("@/app/api/projects/rename/route");
      const req = new Request("http://localhost/api/projects/rename", {
        method: "POST",
        body: JSON.stringify({ id: "abc", name: "New" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects missing id or name", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      const { POST } = await import("@/app/api/projects/rename/route");
      const req = new Request("http://localhost/api/projects/rename", {
        method: "POST",
        body: JSON.stringify({ id: "abc" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing id or name");
    });
  });

  // ---------- POST /api/projects/duplicate ----------
  describe("POST /api/projects/duplicate", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      const { POST } = await import("@/app/api/projects/duplicate/route");
      const req = new Request("http://localhost/api/projects/duplicate", {
        method: "POST",
        body: JSON.stringify({ id: "abc" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects missing id", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      const { POST } = await import("@/app/api/projects/duplicate/route");
      const req = new Request("http://localhost/api/projects/duplicate", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing id");
    });
  });

  // ---------- POST /api/projects/favorite ----------
  describe("POST /api/projects/favorite", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      const { POST } = await import("@/app/api/projects/favorite/route");
      const req = new Request("http://localhost/api/projects/favorite", {
        method: "POST",
        body: JSON.stringify({ id: "abc", isFavorite: true }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects missing id or isFavorite", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: "clerk_123" }),
      }));
      const { POST } = await import("@/app/api/projects/favorite/route");
      const req = new Request("http://localhost/api/projects/favorite", {
        method: "POST",
        body: JSON.stringify({ id: "abc" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing id or isFavorite");
    });
  });

  // ---------- GET /api/projects/list ----------
  describe("GET /api/projects/list", () => {
    it("rejects unauthenticated requests", async () => {
      vi.doMock("@clerk/nextjs/server", () => ({
        auth: vi.fn().mockResolvedValue({ userId: null }),
      }));
      vi.doMock("@/lib/supabase", () => ({
        getSupabaseServiceClient: vi.fn(),
      }));
      vi.doMock("@/lib/ensure-user", () => ({
        ensureUserExists: vi.fn(),
      }));
      const { GET } = await import("@/app/api/projects/list/route");
      const req = new Request("http://localhost/api/projects/list");
      const response = await GET(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });
});
