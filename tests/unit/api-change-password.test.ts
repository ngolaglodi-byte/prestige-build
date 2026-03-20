/**
 * Unit tests for change password API route.
 * Tests password change functionality for agents.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper mock for authenticated user
function mockAuth(user: { id: string; status: string; role: string; mustChangePassword?: boolean } | null) {
  vi.doMock("@/lib/auth/session", () => ({
    getCurrentUser: vi.fn().mockResolvedValue(user),
  }));
}

// Helper mock for change password service
function mockChangePassword(result: { success: boolean; error?: string }) {
  vi.doMock("@/lib/auth/service", () => ({
    changePassword: vi.fn().mockResolvedValue(result),
  }));
}

describe("API Change Password", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("POST /api/auth/change-password", () => {
    it("rejects unauthenticated requests", async () => {
      mockAuth(null);
      mockChangePassword({ success: true });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "old", newPassword: "new" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Non authentifié");
    });

    it("rejects request without current password", async () => {
      mockAuth({ id: "user_123", status: "ACTIVE", role: "AGENT" });
      mockChangePassword({ success: true });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: "new" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Mot de passe actuel et nouveau mot de passe requis");
    });

    it("rejects request without new password", async () => {
      mockAuth({ id: "user_123", status: "ACTIVE", role: "AGENT" });
      mockChangePassword({ success: true });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "old" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.ok).toBe(false);
    });

    it("returns error when current password is incorrect", async () => {
      mockAuth({ id: "user_123", status: "ACTIVE", role: "AGENT" });
      mockChangePassword({ success: false, error: "Mot de passe actuel incorrect" });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "wrong", newPassword: "newpass" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Mot de passe actuel incorrect");
    });

    it("returns error when new password is same as current", async () => {
      mockAuth({ id: "user_123", status: "ACTIVE", role: "AGENT" });
      mockChangePassword({ success: false, error: "Le nouveau mot de passe doit être différent de l'ancien" });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "same", newPassword: "same" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Le nouveau mot de passe doit être différent de l'ancien");
    });

    it("returns error when new password is too short", async () => {
      mockAuth({ id: "user_123", status: "ACTIVE", role: "AGENT" });
      mockChangePassword({ success: false, error: "Le mot de passe doit contenir au moins 4 caractères" });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "old", newPassword: "abc" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.ok).toBe(false);
    });

    it("successfully changes password for agent", async () => {
      mockAuth({ id: "user_123", status: "ACTIVE", role: "AGENT", mustChangePassword: true });
      mockChangePassword({ success: true });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "oldpass", newPassword: "newpass" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });

    it("successfully changes password for admin", async () => {
      mockAuth({ id: "admin_123", status: "ACTIVE", role: "ADMIN" });
      mockChangePassword({ success: true });
      
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "adminold", newPassword: "adminnew" }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await POST(req as any);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });
  });
});
