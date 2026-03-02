import { describe, it, expect } from "vitest";
import {
  getOrCreateCollabRoom,
  joinCollabRoom,
  leaveCollabRoom,
  updateCollabCursor,
  updateCollabSelection,
  getCollabRoomUsers,
  getAllCollabRooms,
  processMessage,
} from "@/lib/collab/CollabServer";

describe("CollabServer", () => {
  const ts = Date.now();

  it("getOrCreateCollabRoom creates a new room", () => {
    const room = getOrCreateCollabRoom(`cs_new_${ts}`);
    expect(room.users.size).toBe(0);
  });

  it("getOrCreateCollabRoom returns existing room", () => {
    const id = `cs_existing_${ts}`;
    const r1 = getOrCreateCollabRoom(id);
    const r2 = getOrCreateCollabRoom(id);
    expect(r1).toBe(r2);
  });

  it("joinCollabRoom adds a user", () => {
    const id = `cs_join_${ts}`;
    joinCollabRoom(id, { id: "u1", name: "Alice", color: "#fff" });
    const users = getCollabRoomUsers(id);
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Alice");
  });

  it("leaveCollabRoom removes a user and cleans up", () => {
    const id = `cs_leave_${ts}`;
    joinCollabRoom(id, { id: "u1", name: "Alice", color: "#fff" });
    leaveCollabRoom(id, "u1");
    expect(getCollabRoomUsers(id)).toHaveLength(0);
  });

  it("leaveCollabRoom is safe for unknown room", () => {
    expect(() => leaveCollabRoom("nonexistent", "u1")).not.toThrow();
  });

  it("updateCollabCursor sets cursor on a user", () => {
    const id = `cs_cursor_${ts}`;
    joinCollabRoom(id, { id: "u1", name: "Alice", color: "#fff" });
    updateCollabCursor(id, "u1", { line: 10, column: 5 }, "main.ts");
    const users = getCollabRoomUsers(id);
    expect(users[0].cursor).toEqual({ line: 10, column: 5 });
    expect(users[0].fileId).toBe("main.ts");
  });

  it("updateCollabSelection sets selection", () => {
    const id = `cs_sel_${ts}`;
    joinCollabRoom(id, { id: "u1", name: "Alice", color: "#fff" });
    updateCollabSelection(id, "u1", {
      startLine: 1, startColumn: 0, endLine: 3, endColumn: 10,
    });
    const users = getCollabRoomUsers(id);
    expect(users[0].selection).toBeDefined();
    expect(users[0].selection!.endLine).toBe(3);
  });

  it("getAllCollabRooms lists rooms", () => {
    const id = `cs_all_${ts}`;
    joinCollabRoom(id, { id: "u1", name: "Alice", color: "#fff" });
    expect(getAllCollabRooms()).toContain(id);
  });

  it("processMessage handles join", () => {
    const msg = {
      type: "join" as const,
      userId: "u2",
      projectId: `cs_msg_${ts}`,
      payload: { name: "Bob", color: "#abc" },
    };
    const result = processMessage(msg);
    expect(result).not.toBeNull();
    expect(getCollabRoomUsers(msg.projectId)).toHaveLength(1);
  });

  it("processMessage handles leave", () => {
    const pid = `cs_msg_leave_${ts}`;
    joinCollabRoom(pid, { id: "u3", name: "C", color: "#000" });
    processMessage({ type: "leave", userId: "u3", projectId: pid, payload: null });
    expect(getCollabRoomUsers(pid)).toHaveLength(0);
  });

  it("processMessage returns null for unknown type", () => {
    const result = processMessage({
      type: "unknown" as "join",
      userId: "x",
      projectId: "y",
      payload: null,
    });
    expect(result).toBeNull();
  });
});
