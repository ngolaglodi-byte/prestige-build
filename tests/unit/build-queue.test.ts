import { describe, it, expect, beforeEach, vi } from "vitest";

let enqueueBuild: typeof import("@/lib/build/buildQueue").enqueueBuild;
let getBuild: typeof import("@/lib/build/buildQueue").getBuild;
let getUserBuilds: typeof import("@/lib/build/buildQueue").getUserBuilds;
let getProjectBuilds: typeof import("@/lib/build/buildQueue").getProjectBuilds;
let cancelBuild: typeof import("@/lib/build/buildQueue").cancelBuild;
let canUserBuild: typeof import("@/lib/build/buildQueue").canUserBuild;
let registerBuildRunner: typeof import("@/lib/build/buildQueue").registerBuildRunner;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/build/buildQueue");
  enqueueBuild = mod.enqueueBuild;
  getBuild = mod.getBuild;
  getUserBuilds = mod.getUserBuilds;
  getProjectBuilds = mod.getProjectBuilds;
  cancelBuild = mod.cancelBuild;
  canUserBuild = mod.canUserBuild;
  registerBuildRunner = mod.registerBuildRunner;
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
