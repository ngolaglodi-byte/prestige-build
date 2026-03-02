import { describe, it, expect } from "vitest";
import { CRDTStore } from "@/lib/collaboration/crdt-store";

describe("collaboration/crdt-store", () => {
  it("sets and gets a value", () => {
    const store = new CRDTStore();
    store.set("key1", "value1", "user-a");
    expect(store.get("key1")).toBe("value1");
  });

  it("lists all keys", () => {
    const store = new CRDTStore();
    store.set("a", 1, "u1");
    store.set("b", 2, "u2");
    expect(store.keys()).toContain("a");
    expect(store.keys()).toContain("b");
  });

  it("merges incoming state and returns changed keys", () => {
    const store = new CRDTStore();
    store.set("x", "old", "u1");

    const incoming = new Map();
    incoming.set("x", { value: "new", timestamp: Date.now() + 1000, author: "u2" });
    incoming.set("y", { value: "fresh", timestamp: Date.now(), author: "u2" });

    const changed = store.merge(incoming);
    expect(changed).toContain("x");
    expect(changed).toContain("y");
    expect(store.get("x")).toBe("new");
    expect(store.get("y")).toBe("fresh");
  });

  it("does not overwrite with older timestamp during merge", () => {
    const store = new CRDTStore();
    store.set("z", "latest", "u1");

    const incoming = new Map();
    incoming.set("z", { value: "stale", timestamp: 0, author: "u2" });

    const changed = store.merge(incoming);
    expect(changed).not.toContain("z");
    expect(store.get("z")).toBe("latest");
  });

  it("deletes a key", () => {
    const store = new CRDTStore();
    store.set("del", "val", "u1");
    expect(store.delete("del")).toBe(true);
    expect(store.get("del")).toBeUndefined();
  });

  it("clears all state", () => {
    const store = new CRDTStore();
    store.set("a", 1, "u1");
    store.clear();
    expect(store.keys()).toHaveLength(0);
  });
});
