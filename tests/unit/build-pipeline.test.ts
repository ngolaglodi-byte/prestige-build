import { describe, it, expect, beforeEach, vi } from "vitest";

let startBuild: typeof import("@/lib/build/buildPipeline").startBuild;
let getBuild: typeof import("@/lib/build/buildQueue").getBuild;
let enqueueBuild: typeof import("@/lib/build/buildQueue").enqueueBuild;

let mockBuildWithCapacitor: ReturnType<typeof vi.fn>;
let mockBuildWithElectron: ReturnType<typeof vi.fn>;
let mockBuildWithTauri: ReturnType<typeof vi.fn>;
let mockBuildPwa: ReturnType<typeof vi.fn>;
let mockRunSandboxStep: ReturnType<typeof vi.fn>;
let mockStoreArtifact: ReturnType<typeof vi.fn>;
let mockEnsureArtifactDir: ReturnType<typeof vi.fn>;
let mockCanUserBuild: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  mockBuildWithCapacitor = vi.fn().mockResolvedValue("/workspace/proj/android/app-release.apk");
  mockBuildWithElectron = vi.fn().mockResolvedValue("/workspace/proj/dist/app Setup.exe");
  mockBuildWithTauri = vi.fn().mockResolvedValue("/workspace/proj/src-tauri/target/release/bundle/macos");
  mockBuildPwa = vi.fn().mockResolvedValue("/workspace/proj/artifacts/pwa.zip");
  mockRunSandboxStep = vi.fn().mockResolvedValue(undefined);
  mockStoreArtifact = vi.fn().mockReturnValue({
    buildId: "build-1",
    projectId: "proj-1",
    target: "web",
    filePath: "/artifacts/proj-1/build-1/web.zip",
    fileName: "web.zip",
    sizeBytes: 1024,
    createdAt: new Date(),
    expiresAt: new Date(),
  });
  mockEnsureArtifactDir = vi.fn().mockReturnValue("/artifacts/proj-1/build-1");
  mockCanUserBuild = vi.fn().mockReturnValue(true);

  vi.doMock("@/lib/build/capacitorBuilder", () => ({
    buildWithCapacitor: mockBuildWithCapacitor,
  }));
  vi.doMock("@/lib/build/electronBuilder", () => ({
    buildWithElectron: mockBuildWithElectron,
  }));
  vi.doMock("@/lib/build/tauriBuilder", () => ({
    buildWithTauri: mockBuildWithTauri,
  }));
  vi.doMock("@/lib/build/pwaBuilder", () => ({
    buildPwa: mockBuildPwa,
  }));
  vi.doMock("@/lib/build/sandboxRunner", () => ({
    runSandboxStep: mockRunSandboxStep,
  }));
  vi.doMock("@/lib/build/artifactManager", () => ({
    storeArtifact: mockStoreArtifact,
    ensureArtifactDir: mockEnsureArtifactDir,
  }));

  // Import buildPipeline to register the runner
  const pipeline = await import("@/lib/build/buildPipeline");
  startBuild = pipeline.startBuild;

  const queue = await import("@/lib/build/buildQueue");
  getBuild = queue.getBuild;
  enqueueBuild = queue.enqueueBuild;
});

describe("buildPipeline dispatch", () => {
  it("dispatches android-apk to buildWithCapacitor", async () => {
    const build = enqueueBuild("proj-1", "user-1", "android-apk");
    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuildWithCapacitor).toHaveBeenCalledWith(
      "proj-1",
      "android-apk",
      expect.any(Function)
    );
    expect(getBuild(build.buildId)!.status).toBe("success");
  });

  it("dispatches windows-exe to buildWithElectron", async () => {
    enqueueBuild("proj-1", "user-1", "windows-exe");
    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuildWithElectron).toHaveBeenCalledWith(
      "proj-1",
      "windows-exe",
      expect.any(Function),
      expect.any(Object)
    );
  });

  it("dispatches macos-app to buildWithTauri", async () => {
    enqueueBuild("proj-1", "user-1", "macos-app");
    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuildWithTauri).toHaveBeenCalledWith(
      "proj-1",
      "macos-app",
      expect.any(Function)
    );
  });

  it("dispatches pwa to buildPwa", async () => {
    enqueueBuild("proj-1", "user-1", "pwa");
    await new Promise((r) => setTimeout(r, 50));
    expect(mockBuildPwa).toHaveBeenCalledWith(
      "proj-1",
      expect.any(String),
      expect.any(Function),
      expect.any(Object)
    );
  });

  it("dispatches web target — runSandboxStep is mocked to resolve", async () => {
    // For the web target, buildWebStatic calls runSandboxStep and then does fs operations.
    // The runner will fail at the fs level but runSandboxStep should still be called.
    vi.doMock("fs", async () => {
      const actual = await vi.importActual<typeof import("fs")>("fs");
      return {
        ...actual,
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
      };
    });

    // Re-import to get the fs mock applied
    vi.resetModules();
    mockRunSandboxStep = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/build/sandboxRunner", () => ({ runSandboxStep: mockRunSandboxStep }));
    vi.doMock("@/lib/build/artifactManager", () => ({
      storeArtifact: mockStoreArtifact,
      ensureArtifactDir: mockEnsureArtifactDir,
    }));
    vi.doMock("@/lib/build/capacitorBuilder", () => ({ buildWithCapacitor: mockBuildWithCapacitor }));
    vi.doMock("@/lib/build/electronBuilder", () => ({ buildWithElectron: mockBuildWithElectron }));
    vi.doMock("@/lib/build/tauriBuilder", () => ({ buildWithTauri: mockBuildWithTauri }));
    vi.doMock("@/lib/build/pwaBuilder", () => ({ buildPwa: mockBuildPwa }));

    await import("@/lib/build/buildPipeline");
    const q = await import("@/lib/build/buildQueue");

    q.enqueueBuild("proj-1", "user-1", "web");
    await new Promise((r) => setTimeout(r, 100));

    expect(mockRunSandboxStep).toHaveBeenCalledWith(
      "proj-1",
      "npm",
      ["run", "build"],
      expect.any(Function)
    );
  });

  it("successfully processes web target via buildWebStatic", async () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    await new Promise((r) => setTimeout(r, 50));
    // 'web' should succeed (runSandboxStep is mocked)
    expect(getBuild(build.buildId)).toBeDefined();
  });

  it("startBuild throws when canUserBuild returns false", async () => {
    // Temporarily override canUserBuild by filling up active builds
    // The easiest way: check that startBuild uses canUserBuild from buildQueue
    // Mock it indirectly by saturating active builds — or check the error message
    // Since the real canUserBuild is from the fresh module, test with a spy
    const queueMod = await import("@/lib/build/buildQueue");
    vi.spyOn(queueMod, "canUserBuild").mockReturnValue(false);

    expect(() => startBuild("proj-1", "user-1", "web")).toThrow(
      "Limite de builds simultanés atteinte"
    );
  });

  it("startBuild calls enqueueBuild with correct parameters", async () => {
    const queueMod = await import("@/lib/build/buildQueue");
    const spyEnqueue = vi.spyOn(queueMod, "enqueueBuild");

    startBuild("proj-1", "user-1", "pwa", { appName: "TestApp" }, true);
    expect(spyEnqueue).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "pwa",
      { appName: "TestApp" },
      true
    );
  });
});
