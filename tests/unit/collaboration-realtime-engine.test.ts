import { describe, it, expect } from "vitest";
import {
  getOrCreateRoom,
  joinRoom,
  leaveRoom,
  updateCursor,
  getRoomUsers,
  getAllRooms,
} from "@/lib/collaboration/realtime-engine";

describe("realtime-engine", () => {
  const roomId = `rte_${Date.now()}`;

  it("getOrCreateRoom creates a new room", () => {
    const room = getOrCreateRoom(roomId);
    expect(room.id).toBe(roomId);
    expect(room.users.size).toBe(0);
  });

  it("getOrCreateRoom returns existing room", () => {
    const r1 = getOrCreateRoom(roomId);
    const r2 = getOrCreateRoom(roomId);
    expect(r1).toBe(r2);
  });

  it("joinRoom adds a user to the room", () => {
    const r = `rte_join_${Date.now()}`;
    joinRoom(r, { id: "u1", name: "Alice", color: "#fff" });
    const users = getRoomUsers(r);
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Alice");
  });

  it("leaveRoom removes a user and cleans up empty rooms", () => {
    const r = `rte_leave_${Date.now()}`;
    joinRoom(r, { id: "u1", name: "Alice", color: "#fff" });
    leaveRoom(r, "u1");
    expect(getRoomUsers(r)).toHaveLength(0);
  });

  it("leaveRoom is a no-op for unknown room", () => {
    expect(() => leaveRoom("nonexistent", "u1")).not.toThrow();
  });

  it("updateCursor sets cursor on a user", () => {
    const r = `rte_cursor_${Date.now()}`;
    joinRoom(r, { id: "u1", name: "Alice", color: "#fff" });
    updateCursor(r, "u1", { x: 100, y: 200, page: "/home" });
    const users = getRoomUsers(r);
    expect(users[0].cursor).toEqual({ x: 100, y: 200, page: "/home" });
  });

  it("getRoomUsers returns empty for unknown room", () => {
    expect(getRoomUsers("no_such_room")).toEqual([]);
  });

  it("getAllRooms returns room ids", () => {
    const r = `rte_all_${Date.now()}`;
    joinRoom(r, { id: "u1", name: "Alice", color: "#fff" });
    expect(getAllRooms()).toContain(r);
  });
});
