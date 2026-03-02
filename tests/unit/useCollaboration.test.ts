import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { RemoteCursor, CollabEdit } from "@/hooks/useCollaboration";

/* ------------------------------------------------------------------ */
/*  Lightweight mock for WebSocket                                     */
/* ------------------------------------------------------------------ */

type WSListener = (ev: { data: string }) => void;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: WSListener | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  /* helpers for tests */
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: typeof data === "string" ? data : JSON.stringify(data) });
  }
  simulateError() {
    this.onerror?.();
  }
}

/* ------------------------------------------------------------------ */
/*  Globals stubs (node env – no window / WebSocket)                   */
/* ------------------------------------------------------------------ */

(globalThis as any).WebSocket = MockWebSocket;
(globalThis as any).window = {
  location: { protocol: "https:", host: "example.com" },
};

/* ------------------------------------------------------------------ */
/*  Minimal React stub so the hook can be loaded in Node               */
/* ------------------------------------------------------------------ */

let stateSlots: { value: any; setter: (v: any) => void }[] = [];
let stateIndex = 0;
let refSlots: { current: any }[] = [];
let refIndex = 0;
let effectCleanups: (() => void)[] = [];

function resetReactStubs() {
  stateSlots = [];
  stateIndex = 0;
  refSlots = [];
  refIndex = 0;
  effectCleanups = [];
}

vi.mock("react", () => ({
  useState: (init: any) => {
    if (stateIndex >= stateSlots.length) {
      const slot = {
        value: typeof init === "function" ? init() : init,
        setter: (v: any) => {
          slot.value = typeof v === "function" ? v(slot.value) : v;
        },
      };
      stateSlots.push(slot);
    }
    const slot = stateSlots[stateIndex++];
    return [slot.value, slot.setter];
  },
  useRef: (init: any) => {
    if (refIndex >= refSlots.length) {
      refSlots.push({ current: init });
    }
    return refSlots[refIndex++];
  },
  useCallback: (fn: any, _deps: any[]) => fn,
  useEffect: (fn: () => (() => void) | void, _deps?: any[]) => {
    const cleanup = fn();
    if (cleanup) effectCleanups.push(cleanup);
  },
}));

/* ------------------------------------------------------------------ */
/*  Import the hook (after mocks are in place)                         */
/* ------------------------------------------------------------------ */

import { useCollaboration } from "@/hooks/useCollaboration";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createHook(overrides: Record<string, any> = {}) {
  resetReactStubs();
  MockWebSocket.instances = [];
  return useCollaboration({
    projectId: "proj_1",
    userId: "user_1",
    userName: "Alice",
    ...overrides,
  });
}

function latestWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

// Named indices into the useState slots (order matches hook declaration)
const CONNECTED_SLOT = 0;
const CURSORS_SLOT = 1;
const COLLABORATORS_SLOT = 2;

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("useCollaboration", () => {
  const originalProtocol = "https:";

  beforeEach(() => {
    vi.useFakeTimers();
    resetReactStubs();
    MockWebSocket.instances = [];
    (globalThis as any).window.location.protocol = originalProtocol;
  });

  afterEach(() => {
    (globalThis as any).window.location.protocol = originalProtocol;
    vi.useRealTimers();
  });

  /* ---------- type exports ---------------------------------------- */

  it("exports RemoteCursor type", () => {
    const cursor: RemoteCursor = {
      userId: "u1",
      name: "A",
      color: "#fff",
      line: 1,
      column: 2,
    };
    expect(cursor.userId).toBe("u1");
  });

  it("exports CollabEdit type", () => {
    const edit: CollabEdit = {
      userId: "u1",
      fileId: "f1",
      changes: { text: "hello" },
    };
    expect(edit.changes.text).toBe("hello");
  });

  /* ---------- connection ------------------------------------------ */

  it("creates a WebSocket with the correct wss URL", () => {
    createHook();
    const ws = latestWs();
    expect(ws).toBeDefined();
    expect(ws.url).toBe("wss://example.com/api/collab?projectId=proj_1");
  });

  it("uses ws:// when protocol is http:", () => {
    (globalThis as any).window.location.protocol = "http:";
    createHook();
    expect(latestWs().url).toContain("ws://");
  });

  it("does not connect when enabled=false", () => {
    createHook({ enabled: false });
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  /* ---------- onopen ---------------------------------------------- */

  it("sends a join message on open", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();
    expect(ws.sent).toHaveLength(1);
    const msg = JSON.parse(ws.sent[0]);
    expect(msg).toEqual({
      type: "join",
      userId: "user_1",
      projectId: "proj_1",
      payload: { name: "Alice" },
    });
  });

  /* ---------- onmessage – cursor ---------------------------------- */

  it("updates cursors when receiving cursor message from another user", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({
      type: "cursor",
      userId: "user_2",
      payload: { name: "Bob", color: "#EC4899", line: 10, column: 5 },
      fileId: "file_1",
    });

    // The setCursors updater was invoked; verify it via the state slot
    const cursorsSlot = stateSlots[CURSORS_SLOT];
    expect(cursorsSlot.value).toHaveLength(1);
    expect(cursorsSlot.value[0]).toMatchObject({
      userId: "user_2",
      name: "Bob",
      color: "#EC4899",
      line: 10,
      column: 5,
      fileId: "file_1",
    });
  });

  it("filters out own userId cursor messages", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({
      type: "cursor",
      userId: "user_1",
      payload: { name: "Alice", color: "#6366F1", line: 1, column: 1 },
    });

    const cursorsSlot = stateSlots[CURSORS_SLOT];
    expect(cursorsSlot.value).toHaveLength(0);
  });

  it("replaces existing cursor for same remote user", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({
      type: "cursor",
      userId: "user_2",
      payload: { line: 1, column: 1 },
    });
    ws.simulateMessage({
      type: "cursor",
      userId: "user_2",
      payload: { line: 5, column: 3 },
    });

    const cursorsSlot = stateSlots[CURSORS_SLOT];
    expect(cursorsSlot.value).toHaveLength(1);
    expect(cursorsSlot.value[0].line).toBe(5);
  });

  it("applies defaults for missing cursor payload fields", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({ type: "cursor", userId: "user_3", payload: {} });

    const cursor = stateSlots[CURSORS_SLOT].value[0];
    expect(cursor.name).toBe("user_3");
    expect(cursor.color).toBe("#6366F1");
    expect(cursor.line).toBe(0);
    expect(cursor.column).toBe(0);
  });

  /* ---------- onmessage – join/leave/sync ------------------------- */

  it("updates collaborators on join message with users array", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    const users = [
      { id: "u1", name: "Alice", color: "#6366F1" },
      { id: "u2", name: "Bob", color: "#EC4899" },
    ];
    ws.simulateMessage({ type: "join", payload: { users } });

    const collabSlot = stateSlots[COLLABORATORS_SLOT];
    expect(collabSlot.value).toEqual(users);
  });

  it("updates collaborators on leave message", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({ type: "leave", payload: { users: [{ id: "u1", name: "Alice", color: "#fff" }] } });
    expect(stateSlots[COLLABORATORS_SLOT].value).toHaveLength(1);
  });

  it("updates collaborators on sync message", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({ type: "sync", payload: { users: [] } });
    expect(stateSlots[COLLABORATORS_SLOT].value).toEqual([]);
  });

  it("ignores join/leave/sync without users array", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    ws.simulateMessage({ type: "join", payload: {} });
    // collaborators should remain at initial empty array
    expect(stateSlots[COLLABORATORS_SLOT].value).toEqual([]);
  });

  /* ---------- invalid JSON ---------------------------------------- */

  it("silently ignores invalid JSON in onmessage", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    expect(() => ws.simulateMessage("not-valid-json{{{")).not.toThrow();
    expect(stateSlots[CURSORS_SLOT].value).toHaveLength(0);
  });

  /* ---------- onclose / reconnect --------------------------------- */

  it("schedules reconnect on close", () => {
    createHook();
    const ws = latestWs();
    ws.simulateOpen();

    // Close triggers reconnect timer
    ws.onclose?.();
    expect(MockWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(2000);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("onerror closes the socket", () => {
    createHook();
    const ws = latestWs();
    const closeSpy = vi.spyOn(ws, "close");
    ws.simulateError();
    expect(closeSpy).toHaveBeenCalled();
  });

  /* ---------- sendCursor ------------------------------------------ */

  it("sendCursor sends correct JSON when connected", () => {
    const { sendCursor } = createHook();
    const ws = latestWs();
    ws.simulateOpen();
    ws.sent = []; // clear join message

    sendCursor(10, 5, "file_42");

    expect(ws.sent).toHaveLength(1);
    expect(JSON.parse(ws.sent[0])).toEqual({
      type: "cursor",
      userId: "user_1",
      projectId: "proj_1",
      fileId: "file_42",
      payload: { line: 10, column: 5, name: "Alice" },
    });
  });

  it("sendCursor does nothing when socket is not open", () => {
    const { sendCursor } = createHook();
    const ws = latestWs();
    ws.readyState = MockWebSocket.CLOSED;

    sendCursor(1, 1);
    // only the join message (if any) – none since socket never opened
    expect(ws.sent).toHaveLength(0);
  });

  /* ---------- sendEdit -------------------------------------------- */

  it("sendEdit sends correct JSON when connected", () => {
    const { sendEdit } = createHook();
    const ws = latestWs();
    ws.simulateOpen();
    ws.sent = [];

    sendEdit("file_1", { range: { start: 0, end: 5 }, text: "hello" });

    expect(ws.sent).toHaveLength(1);
    expect(JSON.parse(ws.sent[0])).toEqual({
      type: "edit",
      userId: "user_1",
      projectId: "proj_1",
      fileId: "file_1",
      payload: { range: { start: 0, end: 5 }, text: "hello" },
    });
  });

  it("sendEdit does nothing when socket is not open", () => {
    const { sendEdit } = createHook();
    const ws = latestWs();
    ws.readyState = MockWebSocket.CLOSED;

    sendEdit("f", { text: "x" });
    expect(ws.sent).toHaveLength(0);
  });

  /* ---------- return shape ---------------------------------------- */

  it("returns the expected shape", () => {
    const result = createHook();
    expect(result).toHaveProperty("connected");
    expect(result).toHaveProperty("cursors");
    expect(result).toHaveProperty("collaborators");
    expect(typeof result.sendCursor).toBe("function");
    expect(typeof result.sendEdit).toBe("function");
  });
});
