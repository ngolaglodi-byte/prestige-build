import { describe, it, expect, beforeEach, vi } from "vitest";

let buildWithCapacitor: typeof import("@/lib/build/capacitorBuilder").buildWithCapacitor;
let runSandboxStep: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  runSandboxStep = vi.fn().mockResolvedValue(undefined);
  vi.doMock("@/lib/build/sandboxRunner", () => ({
    runSandboxStep,
  }));

  const mod = await import("@/lib/build/capacitorBuilder");
  buildWithCapacitor = mod.buildWithCapacitor;
});

describe("buildWithCapacitor", () => {
  const projectId = "test-project";
  const onLog = vi.fn();

  it("returns output path containing app-release.apk for android-apk", async () => {
    const result = await buildWithCapacitor(projectId, "android-apk", onLog);
    expect(result).toContain("android/app/build/outputs/apk/release/app-release.apk");
  });

  it("returns output path containing app-release.aab for android-aab", async () => {
    const result = await buildWithCapacitor(projectId, "android-aab", onLog);
    expect(result).toContain("bundle/release/app-release.aab");
  });

  it("returns output path containing ios/build/App.ipa for ios-ipa", async () => {
    const result = await buildWithCapacitor(projectId, "ios-ipa", onLog);
    expect(result).toContain("ios/build/App.ipa");
  });

  it("throws for unsupported target", async () => {
    await expect(
      buildWithCapacitor(projectId, "web" as never, onLog)
    ).rejects.toThrow("Cible non supportée par Capacitor");
  });

  it("calls runSandboxStep with npm install for capacitor", async () => {
    await buildWithCapacitor(projectId, "android-apk", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npm",
      ["install", "@capacitor/core", "@capacitor/cli"],
      onLog
    );
  });

  it("calls runSandboxStep with npm run build", async () => {
    await buildWithCapacitor(projectId, "android-apk", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npm",
      ["run", "build"],
      onLog
    );
  });

  it("calls runSandboxStep with cap sync", async () => {
    await buildWithCapacitor(projectId, "android-apk", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npx",
      ["cap", "sync"],
      onLog
    );
  });

  it("calls runSandboxStep with cap add android for android targets", async () => {
    await buildWithCapacitor(projectId, "android-apk", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npx",
      ["cap", "add", "android"],
      onLog
    );
  });

  it("calls runSandboxStep with cap add ios for ios-ipa", async () => {
    await buildWithCapacitor(projectId, "ios-ipa", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npx",
      ["cap", "add", "ios"],
      onLog
    );
  });
});
