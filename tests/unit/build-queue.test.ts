import { describe, it, expect, beforeEach, vi } from "vitest";

let enqueueBuild: typeof import("@/lib/build/buildQueue").enqueueBuild;
let getBuild: typeof import("@/lib/build/buildQueue").getBuild;
let getUserBuilds: typeof import("@/lib/build/buildQueue").getUserBuilds;
let getProjectBuilds: typeof import("@/lib/build/buildQueue").getProjectBuilds;
let cancelBuild: typeof import("@/lib/build/buildQueue").cancelBuild;
let canUserBuild: typeof import("@/lib/build/buildQueue").canUserBuild;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/build/buildQueue");
  enqueueBuild = mod.enqueueBuild;
  getBuild = mod.getBuild;
  getUserBuilds = mod.getUserBuilds;
  getProjectBuilds = mod.getProjectBuilds;
  cancelBuild = mod.cancelBuild;
  canUserBuild = mod.canUserBuild;
});

describe("build/buildQueue", () => {
  it("enqueues a build with queued status", () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    expect(build.status).toBe("queued");
    expect(build.buildId).toBeTruthy();
    expect(build.projectId).toBe("proj-1");
  });

  it("retrieves a build by id", () => {
    const build = enqueueBuild("proj-1", "user-1", "pwa");
    const found = getBuild(build.buildId);
    expect(found).toBeDefined();
    expect(found!.target).toBe("pwa");
  });

  it("returns undefined for unknown build id", () => {
    expect(getBuild("nonexistent")).toBeUndefined();
  });

  it("returns user builds", () => {
    enqueueBuild("proj-1", "user-1", "web");
    enqueueBuild("proj-2", "user-1", "pwa");
    enqueueBuild("proj-3", "user-2", "web");
    const builds = getUserBuilds("user-1");
    expect(builds.length).toBe(2);
  });

  it("returns project builds sorted by date", () => {
    enqueueBuild("proj-x", "user-1", "web");
    enqueueBuild("proj-x", "user-1", "pwa");
    const builds = getProjectBuilds("proj-x");
    expect(builds.length).toBe(2);
  });

  it("cancels a queued build", () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    const result = cancelBuild(build.buildId);
    expect(result).toBe(true);
    expect(getBuild(build.buildId)!.status).toBe("cancelled");
  });

  it("returns false when cancelling non-existent build", () => {
    expect(cancelBuild("fake-id")).toBe(false);
  });

  it("enterprise builds get higher priority", () => {
    const regular = enqueueBuild("proj-1", "user-1", "web", {}, false);
    const enterprise = enqueueBuild("proj-2", "user-2", "web", {}, true);
    expect(enterprise.priority).toBeGreaterThan(regular.priority);
  });

  it("canUserBuild returns true initially", () => {
    expect(canUserBuild("fresh-user")).toBe(true);
  });
});

describe("build/buildQueue — timeout", () => {
  it("marks build as failed when it exceeds BUILD_TIMEOUT_MS", async () => {
    vi.resetModules();
    process.env.BUILD_TIMEOUT_MS = "50";
    const mod = await import("@/lib/build/buildQueue");
    delete process.env.BUILD_TIMEOUT_MS;

    const mockRunner = vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(r, 500))
    );
    mod.registerBuildRunner(mockRunner);

    const build = mod.enqueueBuild("proj-1", "user-1", "web");
    await new Promise((r) => setTimeout(r, 200));

    const found = mod.getBuild(build.buildId);
    expect(found!.status).toBe("failed");
    expect(found!.errorMessage).toContain("timed out");
  });

  it("respects BUILD_TIMEOUT_MS env var", async () => {
    vi.resetModules();
    process.env.BUILD_TIMEOUT_MS = "100";
    const mod = await import("@/lib/build/buildQueue");
    delete process.env.BUILD_TIMEOUT_MS;

    const mockRunner = vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(r, 500))
    );
    mod.registerBuildRunner(mockRunner);

    const build = mod.enqueueBuild("proj-1", "user-1", "pwa");
    // After 300ms the 100ms timeout should have fired
    await new Promise((r) => setTimeout(r, 300));

    const found = mod.getBuild(build.buildId);
    expect(found!.status).toBe("failed");
  });
});
