import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper mock for authenticated user
function mockAuth(user: { id: string; status: string } | null) {
  vi.doMock("@/lib/auth/session", () => ({
    getCurrentUser: vi.fn().mockResolvedValue(user),
  }));
}

// Helper to build a chainable Supabase mock
function makeSupabaseMock(overrides: {
  selectData?: unknown;
  selectError?: unknown;
  insertData?: unknown;
  insertError?: unknown;
  deleteError?: unknown;
  updateError?: unknown;
} = {}) {
  const single = vi.fn().mockResolvedValue({
    data: overrides.insertData ?? overrides.selectData ?? null,
    error: overrides.insertError ?? overrides.selectError ?? null,
  });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const eq = vi.fn().mockImplementation(function (this: unknown) { return this as unknown; });
  const ilike = vi.fn().mockImplementation(function (this: unknown) { return this as unknown; });
  const order = vi.fn().mockImplementation(function (this: unknown) { return this as unknown; });
  const range = vi.fn().mockResolvedValue({
    data: overrides.selectData ?? [],
    error: overrides.selectError ?? null,
    count: 0,
  });
  const deleteFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: overrides.deleteError ?? null }),
    }),
  });
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: overrides.updateError ?? null }),
  });

  const chain = { select, insert, delete: deleteFn, update, eq, ilike, order, range, single };
  const from = vi.fn().mockReturnValue(chain);
  return { createClient: vi.fn().mockReturnValue({ from }) };
}

describe("API Templates", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  });

  // ---------- POST /api/templates ----------
  describe("POST /api/templates", () => {
    function setupMocks(user: { id: string; status: string } | null, supaOverrides = {}) {
      mockAuth(user);
      vi.doMock("@supabase/supabase-js", () => makeSupabaseMock(supaOverrides));
    }

    it("rejects unauthenticated requests", async () => {
      setupMocks(null);
      const { POST } = await import("@/app/api/templates/route");
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "T", files: [{ path: "a", content: "b" }] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("rejects missing name", async () => {
      setupMocks({ id: "user-123", status: "ACTIVE" });
      const { POST } = await import("@/app/api/templates/route");
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ files: [{ path: "a", content: "b" }] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Le nom et les fichiers sont requis.");
    });

    it("rejects missing files array", async () => {
      setupMocks({ id: "user-123", status: "ACTIVE" });
      const { POST } = await import("@/app/api/templates/route");
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "My Template" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Le nom et les fichiers sont requis.");
    });

    it("rejects empty files array", async () => {
      setupMocks({ id: "user-123", status: "ACTIVE" });
      const { POST } = await import("@/app/api/templates/route");
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "My Template", files: [] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Le nom et les fichiers sont requis.");
    });

    it("creates template with valid data", async () => {
      const templateData = {
        id: "tpl-1",
        name: "My Template",
        files: [{ path: "index.html", content: "<h1>Hi</h1>" }],
        user_id: "user-123",
      };
      setupMocks({ id: "user-123", status: "ACTIVE" }, { insertData: templateData });
      const { POST } = await import("@/app/api/templates/route");
      const req = new Request("http://localhost/api/templates", {
        method: "POST",
        body: JSON.stringify({ name: "My Template", files: [{ path: "index.html", content: "<h1>Hi</h1>" }] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.template).toEqual(templateData);
    });
  });

  // ---------- POST /api/templates/import ----------
  describe("POST /api/templates/import", () => {
    function setupMocks(user: { id: string; status: string } | null, supaOverrides = {}) {
      mockAuth(user);
      vi.doMock("@supabase/supabase-js", () => makeSupabaseMock(supaOverrides));
    }

    it("rejects unauthenticated requests", async () => {
      setupMocks(null);
      const { POST } = await import("@/app/api/templates/import/route");
      const req = new Request("http://localhost/api/templates/import", {
        method: "POST",
        body: JSON.stringify({ name: "T", files: [{ path: "a", content: "b" }] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("rejects missing name", async () => {
      setupMocks({ id: "user-123", status: "ACTIVE" });
      const { POST } = await import("@/app/api/templates/import/route");
      const req = new Request("http://localhost/api/templates/import", {
        method: "POST",
        body: JSON.stringify({ files: [{ path: "a", content: "b" }] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Le fichier JSON doit contenir un nom et des fichiers.");
    });

    it("rejects missing files", async () => {
      setupMocks({ id: "user-123", status: "ACTIVE" });
      const { POST } = await import("@/app/api/templates/import/route");
      const req = new Request("http://localhost/api/templates/import", {
        method: "POST",
        body: JSON.stringify({ name: "Imported" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Le fichier JSON doit contenir un nom et des fichiers.");
    });

    it("rejects files without path or content", async () => {
      setupMocks({ id: "user-123", status: "ACTIVE" });
      const { POST } = await import("@/app/api/templates/import/route");
      const req = new Request("http://localhost/api/templates/import", {
        method: "POST",
        body: JSON.stringify({ name: "Imported", files: [{ path: "a.txt" }] }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Chaque fichier doit avoir un chemin (path) et un contenu (content).");
    });

    it("imports template with valid data", async () => {
      const templateData = {
        id: "tpl-2",
        name: "Imported",
        files: [{ path: "main.js", content: "console.log('hi')" }],
        user_id: "user-123",
      };
      setupMocks({ id: "user-123", status: "ACTIVE" }, { insertData: templateData });
      const { POST } = await import("@/app/api/templates/import/route");
      const req = new Request("http://localhost/api/templates/import", {
        method: "POST",
        body: JSON.stringify({
          name: "Imported",
          files: [{ path: "main.js", content: "console.log('hi')" }],
        }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.template).toEqual(templateData);
    });
  });

  // ---------- DELETE /api/templates/[templateId] ----------
  describe("DELETE /api/templates/[templateId]", () => {
    it("rejects unauthenticated requests", async () => {
      mockAuth(null);
      vi.doMock("@supabase/supabase-js", () => makeSupabaseMock());
      const { DELETE } = await import("@/app/api/templates/[templateId]/route");
      const req = new Request("http://localhost/api/templates/tpl-1", {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: { templateId: "tpl-1" } });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  // ---------- POST /api/templates/[templateId]/use ----------
  describe("POST /api/templates/[templateId]/use", () => {
    it("rejects unauthenticated requests", async () => {
      mockAuth(null);
      vi.doMock("@supabase/supabase-js", () => makeSupabaseMock());
      const { POST } = await import("@/app/api/templates/[templateId]/use/route");
      const req = new Request("http://localhost/api/templates/tpl-1/use", {
        method: "POST",
        body: JSON.stringify({ name: "My Project" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req, { params: { templateId: "tpl-1" } });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("rejects missing project name", async () => {
      mockAuth({ id: "user-123", status: "ACTIVE" });
      vi.doMock("@supabase/supabase-js", () => makeSupabaseMock());
      const { POST } = await import("@/app/api/templates/[templateId]/use/route");
      const req = new Request("http://localhost/api/templates/tpl-1/use", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req, { params: { templateId: "tpl-1" } });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Project name is required.");
    });
  });
});
