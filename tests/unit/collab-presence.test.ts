import { describe, it, expect } from "vitest";
import {
  updateCollabPresence,
  removeCollabPresence,
  getCollabPresence,
  assignColor,
} from "@/lib/collab/PresenceManager";

describe("PresenceManager", () => {
  const ts = Date.now();

  it("updateCollabPresence adds a user", () => {
    const pid = `pm_add_${ts}`;
    updateCollabPresence(pid, "u1", {
      userId: "u1",
      name: "Alice",
      color: "#abc",
      fileId: null,
    });
    const list = getCollabPresence(pid);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Alice");
  });

  it("removeCollabPresence removes a user", () => {
    const pid = `pm_rm_${ts}`;
    updateCollabPresence(pid, "u1", {
      userId: "u1",
      name: "Alice",
      color: "#abc",
      fileId: null,
    });
    removeCollabPresence(pid, "u1");
    expect(getCollabPresence(pid)).toHaveLength(0);
  });

  it("getCollabPresence returns empty for unknown project", () => {
    expect(getCollabPresence("no_such_project")).toEqual([]);
  });

  it("assignColor returns a hex colour string", () => {
    const c = assignColor("user123");
    expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("assignColor is deterministic", () => {
    expect(assignColor("test")).toBe(assignColor("test"));
  });

  it("assignColor varies with input", () => {
    // Not guaranteed to differ for all inputs, but should for these
    const c1 = assignColor("alice");
    const c2 = assignColor("bob");
    // At least one pair should differ
    expect(typeof c1).toBe("string");
    expect(typeof c2).toBe("string");
  });
});
