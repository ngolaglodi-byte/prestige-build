import { describe, it, expect } from "vitest";
import {
  BUILD_TARGETS,
  getBuildTargetConfig,
  getTargetsByPlatform,
  type BuildTarget,
} from "@/lib/build/buildTargets";

describe("build/buildTargets", () => {
  it("has 11 build targets", () => {
    expect(BUILD_TARGETS).toHaveLength(11);
  });

  it("includes web target", () => {
    const web = BUILD_TARGETS.find((t) => t.target === "web");
    expect(web).toBeDefined();
    expect(web!.platform).toBe("web");
  });

  it("includes pwa target", () => {
    const pwa = BUILD_TARGETS.find((t) => t.target === "pwa");
    expect(pwa).toBeDefined();
    expect(pwa!.toolchain).toBe("pwa");
  });

  describe("getBuildTargetConfig", () => {
    it("returns config for valid target", () => {
      const config = getBuildTargetConfig("android-apk");
      expect(config).toBeDefined();
      expect(config!.platform).toBe("android");
      expect(config!.toolchain).toBe("capacitor");
    });

    it("returns undefined for invalid target", () => {
      const config = getBuildTargetConfig("invalid" as BuildTarget);
      expect(config).toBeUndefined();
    });

    it("returns correct extension for windows-exe", () => {
      const config = getBuildTargetConfig("windows-exe");
      expect(config!.outputExtension).toBe(".exe");
    });
  });

  describe("getTargetsByPlatform", () => {
    it("returns android targets", () => {
      const targets = getTargetsByPlatform("android");
      expect(targets.length).toBe(2);
      expect(targets.every((t) => t.platform === "android")).toBe(true);
    });

    it("returns linux targets", () => {
      const targets = getTargetsByPlatform("linux");
      expect(targets.length).toBe(2);
    });

    it("returns empty for unknown platform", () => {
      const targets = getTargetsByPlatform("unknown" as any);
      expect(targets).toEqual([]);
    });
  });

  it("all targets have required fields", () => {
    for (const t of BUILD_TARGETS) {
      expect(t.target).toBeTruthy();
      expect(t.platform).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(t.toolchain).toBeTruthy();
      expect(typeof t.requiresNativeSdk).toBe("boolean");
      expect(t.outputExtension).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });

  it("native targets require SDK", () => {
    const nativeTargets = BUILD_TARGETS.filter((t) =>
      ["android", "ios"].includes(t.platform)
    );
    expect(nativeTargets.every((t) => t.requiresNativeSdk)).toBe(true);
  });
});
