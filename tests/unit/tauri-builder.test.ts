import { describe, it, expect, beforeEach, vi } from "vitest";

let buildWithTauri: typeof import("@/lib/build/tauriBuilder").buildWithTauri;
let runSandboxStep: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  runSandboxStep = vi.fn().mockResolvedValue(undefined);
  vi.doMock("@/lib/build/sandboxRunner", () => ({
    runSandboxStep,
  }));

  const mod = await import("@/lib/build/tauriBuilder");
  buildWithTauri = mod.buildWithTauri;
});

describe("buildWithTauri", () => {
  const projectId = "test-project";
  const onLog = vi.fn();

  it("returns output path containing bundle/macos for macos-app", async () => {
    const result = await buildWithTauri(projectId, "macos-app", onLog);
    expect(result).toContain("bundle/macos");
  });

  it("returns output path containing bundle/msi for windows-exe", async () => {
    const result = await buildWithTauri(projectId, "windows-exe", onLog);
    expect(result).toContain("bundle/msi");
  });

  it("returns output path containing bundle/appimage for linux-appimage", async () => {
    const result = await buildWithTauri(projectId, "linux-appimage", onLog);
    expect(result).toContain("bundle/appimage");
  });

  it("returns output path containing bundle/deb for linux-deb", async () => {
    const result = await buildWithTauri(projectId, "linux-deb", onLog);
    expect(result).toContain("bundle/deb");
  });

  it("calls runSandboxStep to install @tauri-apps/cli", async () => {
    await buildWithTauri(projectId, "macos-app", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npm",
      ["install", "--save-dev", "@tauri-apps/cli"],
      onLog
    );
  });

  it("calls runSandboxStep with npx tauri build", async () => {
    await buildWithTauri(projectId, "macos-app", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npx",
      ["tauri", "build"],
      onLog
    );
  });
});
