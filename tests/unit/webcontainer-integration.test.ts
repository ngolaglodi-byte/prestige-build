import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock helpers ---

type ServerReadyCallback = (port: number, url: string) => void;

function createMockProcess(exitCode: number = 0) {
  return {
    output: { pipeTo: vi.fn() },
    exit: Promise.resolve(exitCode),
    kill: vi.fn(),
  };
}

// Persistent mock WebContainer — getWebContainer caches the singleton so we
// must reuse the same object across tests and reset its methods in beforeEach.
const mockWc = {
  mount: vi.fn().mockResolvedValue(undefined),
  spawn: vi.fn(),
  on: vi.fn(),
};

vi.doMock("@webcontainer/api", () => ({
  WebContainer: {
    boot: vi.fn(() => Promise.resolve(mockWc)),
  },
}));

// Import after mocking
const {
  startWebContainerPreview,
  getWebContainer,
  detectDevCommand,
} = await import("@/lib/preview/webcontainer");

describe("startWebContainerPreview integration", () => {
  const testFiles = {
    "package.json": { content: '{"scripts":{"dev":"next dev"}}' },
    "src/index.ts": { content: 'console.log("hello")' },
  };

  /** Set up spawn to return the given processes and auto-fire server-ready. */
  function setupSpawn(...processes: ReturnType<typeof createMockProcess>[]) {
    mockWc.spawn.mockReset();
    for (const p of processes) {
      mockWc.spawn.mockResolvedValueOnce(p);
    }
  }

  function autoServerReady(port = 3000, url = "http://localhost:3000") {
    mockWc.on.mockImplementation((event: string, cb: ServerReadyCallback) => {
      if (event === "server-ready") {
        queueMicrotask(() => cb(port, url));
      }
    });
  }

  beforeEach(() => {
    mockWc.mount.mockClear();
    mockWc.spawn.mockReset();
    mockWc.on.mockReset();

    // Default happy-path setup
    setupSpawn(createMockProcess(0), createMockProcess(0));
    autoServerReady();
  });

  it("mounts files and spawns install + dev server", async () => {
    await startWebContainerPreview({ files: testFiles });

    expect(mockWc.mount).toHaveBeenCalledOnce();
    expect(mockWc.mount).toHaveBeenCalledWith(
      expect.objectContaining({
        "package.json": { file: { contents: '{"scripts":{"dev":"next dev"}}' } },
      })
    );
    expect(mockWc.spawn).toHaveBeenCalledTimes(2);
    expect(mockWc.spawn).toHaveBeenNthCalledWith(1, "npm", ["install"]);
    expect(mockWc.spawn).toHaveBeenNthCalledWith(2, "npm", ["run", "dev"]);
  });

  it("calls onLog with mount, install, and dev server messages", async () => {
    const onLog = vi.fn();

    await startWebContainerPreview({ files: testFiles, onLog });

    const messages = onLog.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(messages).toContain("Montage des fichiers dans le conteneur…");
    expect(messages).toContain("Installation des dépendances (npm install)…");
    expect(messages.some((m: string) => m.includes("Démarrage du serveur de développement"))).toBe(true);
    expect(messages.some((m: string) => m.includes("Serveur prêt sur"))).toBe(true);
  });

  it("calls onServerReady when server is ready", async () => {
    const onServerReady = vi.fn();

    await startWebContainerPreview({ files: testFiles, onServerReady });

    expect(onServerReady).toHaveBeenCalledOnce();
    expect(onServerReady).toHaveBeenCalledWith("http://localhost:3000");
  });

  it("throws and calls onError when npm install fails", async () => {
    setupSpawn(createMockProcess(1));

    const onError = vi.fn();
    const onLog = vi.fn();

    await expect(
      startWebContainerPreview({ files: testFiles, onError, onLog })
    ).rejects.toThrow("npm install a échoué avec le code 1");

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith("npm install a échoué avec le code 1");
  });

  it("returns url and restart function", async () => {
    const result = await startWebContainerPreview({ files: testFiles });

    expect(result.url).toBe("http://localhost:3000");
    expect(typeof result.restart).toBe("function");
  });

  it("restart kills the dev process and spawns a new one", async () => {
    const devProcess = createMockProcess(0);
    const newDevProcess = createMockProcess(0);

    setupSpawn(createMockProcess(0), devProcess, newDevProcess);

    const result = await startWebContainerPreview({ files: testFiles });
    await result.restart();

    expect(devProcess.kill).toHaveBeenCalledOnce();
    expect(mockWc.spawn).toHaveBeenCalledTimes(3);
    expect(mockWc.spawn).toHaveBeenNthCalledWith(3, "npm", ["run", "dev"]);
  });
});

describe("detectDevCommand with /package.json fallback", () => {
  it("uses /package.json path as fallback for dev command detection", async () => {
    // startWebContainerPreview falls back to files["/package.json"] when
    // files["package.json"] is absent. Verify detectDevCommand works with
    // content that would come from either key.
    const content = JSON.stringify({ scripts: { start: "node index.js" } });
    expect(detectDevCommand(content)).toBe("npm run start");
  });
});

describe("getWebContainer singleton", () => {
  it("returns singleton instance", async () => {
    const wc1 = await getWebContainer();
    const wc2 = await getWebContainer();
    expect(wc1).toBe(wc2);
  });
});
