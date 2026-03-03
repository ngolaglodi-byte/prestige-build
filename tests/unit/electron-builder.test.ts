import { describe, it, expect, beforeEach, vi } from "vitest";

let buildWithElectron: typeof import("@/lib/build/electronBuilder").buildWithElectron;
let runSandboxStep: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  runSandboxStep = vi.fn().mockResolvedValue(undefined);
  vi.doMock("@/lib/build/sandboxRunner", () => ({
    runSandboxStep,
  }));

  const mod = await import("@/lib/build/electronBuilder");
  buildWithElectron = mod.buildWithElectron;
});

describe("buildWithElectron", () => {
  const projectId = "test-project";
  const onLog = vi.fn();

  it("returns output path ending with Setup.exe for windows-exe", async () => {
    const result = await buildWithElectron(projectId, "windows-exe", onLog);
    expect(result).toMatch(/Setup\.exe$/);
  });

  it("returns output path ending with .msi for windows-msi", async () => {
    const result = await buildWithElectron(projectId, "windows-msi", onLog);
    expect(result).toMatch(/\.msi$/);
  });

  it("returns output path ending with .dmg for macos-dmg", async () => {
    const result = await buildWithElectron(projectId, "macos-dmg", onLog);
    expect(result).toMatch(/\.dmg$/);
  });

  it("returns output path ending with .AppImage for linux-appimage", async () => {
    const result = await buildWithElectron(projectId, "linux-appimage", onLog);
    expect(result).toMatch(/\.AppImage$/);
  });

  it("returns output path ending with .deb for linux-deb", async () => {
    const result = await buildWithElectron(projectId, "linux-deb", onLog);
    expect(result).toMatch(/\.deb$/);
  });

  it("uses default appName 'app' in output path", async () => {
    const result = await buildWithElectron(projectId, "windows-exe", onLog);
    expect(result).toContain("app Setup.exe");
  });

  it("uses custom appName in output path", async () => {
    const result = await buildWithElectron(projectId, "windows-exe", onLog, {
      appName: "MyApp",
    });
    expect(result).toContain("MyApp Setup.exe");
  });

  it("calls runSandboxStep with electron-builder flags for windows-exe", async () => {
    await buildWithElectron(projectId, "windows-exe", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npx",
      expect.arrayContaining(["electron-builder", "--win", "--x64"]),
      onLog
    );
  });

  it("calls runSandboxStep with electron-builder flags for linux-appimage", async () => {
    await buildWithElectron(projectId, "linux-appimage", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npx",
      expect.arrayContaining(["electron-builder", "--linux", "AppImage"]),
      onLog
    );
  });

  it("calls runSandboxStep to install electron-builder", async () => {
    await buildWithElectron(projectId, "windows-exe", onLog);
    expect(runSandboxStep).toHaveBeenCalledWith(
      projectId,
      "npm",
      ["install", "--save-dev", "electron-builder"],
      onLog
    );
  });
});
