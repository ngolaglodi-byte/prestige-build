import { describe, it, expect, beforeEach, vi } from "vitest";

let enqueueBuild: typeof import("@/lib/build/buildQueue").enqueueBuild;
let getBuild: typeof import("@/lib/build/buildQueue").getBuild;
let cancelBuild: typeof import("@/lib/build/buildQueue").cancelBuild;
let registerBuildRunner: typeof import("@/lib/build/buildQueue").registerBuildRunner;
let getActiveBuildCount: typeof import("@/lib/build/buildQueue").getActiveBuildCount;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/build/buildQueue");
  enqueueBuild = mod.enqueueBuild;
  getBuild = mod.getBuild;
  cancelBuild = mod.cancelBuild;
  registerBuildRunner = mod.registerBuildRunner;
  getActiveBuildCount = mod.getActiveBuildCount;
});

describe("buildQueue (extended)", () => {
  it("build has progress set to 0 initially", () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    expect(build.progress).toBe(0);
  });

  it("build has empty logs initially", () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    expect(build.logs).toEqual([]);
  });

  it("build has createdAt timestamp", () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    expect(build.createdAt).toBeInstanceOf(Date);
  });

  it("cannot cancel completed build", () => {
    const build = enqueueBuild("proj-1", "user-1", "web");
    // Manually set status to success
    const found = getBuild(build.buildId);
    if (found) found.status = "success";
    expect(cancelBuild(build.buildId)).toBe(false);
  });

  it("getActiveBuildCount returns 0 initially", () => {
    expect(getActiveBuildCount("user-new")).toBe(0);
  });

  it("starts processing when runner is registered and build is enqueued", async () => {
    const mockRunner = vi.fn().mockResolvedValue("https://artifact.url/build.zip");
    registerBuildRunner(mockRunner);
    const build = enqueueBuild("proj-1", "user-1", "web");
    // Give time for async processing
    await new Promise((r) => setTimeout(r, 50));
    const found = getBuild(build.buildId);
    expect(found).toBeDefined();
    // The runner should have been called
    expect(mockRunner).toHaveBeenCalled();
  });

  it("handles build failure from runner", async () => {
    const mockRunner = vi.fn().mockRejectedValue(new Error("Build failed"));
    registerBuildRunner(mockRunner);
    const build = enqueueBuild("proj-1", "user-1", "web");
    await new Promise((r) => setTimeout(r, 50));
    const found = getBuild(build.buildId);
    expect(found!.status).toBe("failed");
    expect(found!.errorMessage).toBe("Build failed");
  });

  it("successful build has artifactUrl", async () => {
    const mockRunner = vi.fn().mockResolvedValue("https://cdn.example.com/output.zip");
    registerBuildRunner(mockRunner);
    const build = enqueueBuild("proj-1", "user-1", "web");
    await new Promise((r) => setTimeout(r, 50));
    const found = getBuild(build.buildId);
    expect(found!.status).toBe("success");
    expect(found!.artifactUrl).toBe("https://cdn.example.com/output.zip");
    expect(found!.progress).toBe(100);
  });

  it("cancelling a building task sets status to cancelled", async () => {
    const mockRunner = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 5000)));
    registerBuildRunner(mockRunner);
    const build = enqueueBuild("proj-1", "user-1", "web");
    await new Promise((r) => setTimeout(r, 20));
    expect(build.status).toBe("building");
    cancelBuild(build.buildId);
    expect(getBuild(build.buildId)!.status).toBe("cancelled");
  });
});
