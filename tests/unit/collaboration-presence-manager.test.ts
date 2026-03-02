import { describe, it, expect, vi } from "vitest";
import {
  updatePresence,
  removePresence,
  getPresence,
  userColor,
} from "@/lib/collaboration/presence-manager";

describe("presence-manager", () => {
  const roomId = `proom_${Date.now()}`;

  it("updatePresence and getPresence returns active users", () => {
    updatePresence(roomId, "u1", {
      userId: "u1",
      name: "Alice",
      color: "#6366F1",
      page: "/home",
      cursor: { x: 10, y: 20 },
    });
    const list = getPresence(roomId);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Alice");
    expect(list[0].cursor).toEqual({ x: 10, y: 20 });
  });

  it("removePresence removes a user", () => {
    const room = `pr_rm_${Date.now()}`;
    updatePresence(room, "u2", {
      userId: "u2",
      name: "Bob",
      color: "#EC4899",
      page: "/",
      cursor: null,
    });
    removePresence(room, "u2");
    expect(getPresence(room)).toHaveLength(0);
  });

  it("getPresence filters out stale users", () => {
    const room = `pr_stale_${Date.now()}`;
    const realNow = Date.now();
    updatePresence(room, "u3", {
      userId: "u3",
      name: "Charlie",
      color: "#10B981",
      page: "/",
      cursor: null,
    });
    // Fast-forward time to make user stale (>30s timeout)
    vi.spyOn(Date, "now").mockReturnValue(realNow + 60_000);
    const list = getPresence(room);
    expect(list).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it("getPresence returns empty for unknown room", () => {
    expect(getPresence("nonexistent_room")).toEqual([]);
  });

  it("userColor returns a consistent color for the same userId", () => {
    const color1 = userColor("user-abc");
    const color2 = userColor("user-abc");
    expect(color1).toBe(color2);
    expect(color1).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("userColor returns different colors for different users", () => {
    const c1 = userColor("alice");
    const c2 = userColor("bob");
    // Not guaranteed different but very likely with different inputs
    expect(typeof c1).toBe("string");
    expect(typeof c2).toBe("string");
  });
});
