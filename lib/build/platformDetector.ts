// lib/build/platformDetector.ts

import fs from "fs";
import path from "path";
import type { BuildPlatform, BuildTarget, BuildTargetConfig } from "./buildTargets";
import { BUILD_TARGETS } from "./buildTargets";

export interface PlatformDetectionResult {
  availablePlatforms: BuildPlatform[];
  availableTargets: BuildTargetConfig[];
  detectedToolchains: string[];
}

function readPackageJson(
  projectPath: string
): Record<string, unknown> | null {
  const pkgPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }
}

function hasDependency(
  pkg: Record<string, unknown>,
  dep: string
): boolean {
  const deps = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {}),
  };
  return dep in deps;
}

function hasPwaSupport(projectPath: string): boolean {
  const manifestPath = path.join(projectPath, "public", "manifest.json");
  const manifestWebPath = path.join(projectPath, "public", "manifest.webmanifest");
  const swPath = path.join(projectPath, "public", "sw.js");
  const swSrcPath = path.join(projectPath, "src", "sw.js");

  return (
    fs.existsSync(manifestPath) ||
    fs.existsSync(manifestWebPath) ||
    fs.existsSync(swPath) ||
    fs.existsSync(swSrcPath)
  );
}

export function detectAvailablePlatforms(
  projectPath: string
): PlatformDetectionResult {
  const pkg = readPackageJson(projectPath);
  const platforms = new Set<BuildPlatform>();
  const toolchains = new Set<string>();

  // Web builds are always available
  platforms.add("web");
  toolchains.add("web");

  if (!pkg) {
    return {
      availablePlatforms: Array.from(platforms),
      availableTargets: BUILD_TARGETS.filter((t) =>
        platforms.has(t.platform)
      ),
      detectedToolchains: Array.from(toolchains),
    };
  }

  // PWA detection
  if (hasDependency(pkg, "next-pwa") || hasPwaSupport(projectPath)) {
    platforms.add("pwa");
    toolchains.add("pwa");
  }

  // Capacitor → Android + iOS
  if (
    hasDependency(pkg, "@capacitor/core") ||
    hasDependency(pkg, "@capacitor/android") ||
    hasDependency(pkg, "@capacitor/ios")
  ) {
    platforms.add("android");
    platforms.add("ios");
    toolchains.add("capacitor");
  }

  // Electron → Windows + macOS + Linux
  if (
    hasDependency(pkg, "electron") ||
    hasDependency(pkg, "electron-builder")
  ) {
    platforms.add("windows");
    platforms.add("macos");
    platforms.add("linux");
    toolchains.add("electron");
  }

  // Tauri → Windows + macOS + Linux (alternative)
  if (hasDependency(pkg, "@tauri-apps/api")) {
    platforms.add("windows");
    platforms.add("macos");
    platforms.add("linux");
    toolchains.add("tauri");
  }

  const availablePlatforms = Array.from(platforms) as BuildPlatform[];
  const availableTargets = BUILD_TARGETS.filter((t) =>
    availablePlatforms.includes(t.platform)
  );

  return {
    availablePlatforms,
    availableTargets,
    detectedToolchains: Array.from(toolchains),
  };
}

export function isTargetAvailable(
  target: BuildTarget,
  projectPath: string
): boolean {
  const { availableTargets } = detectAvailablePlatforms(projectPath);
  return availableTargets.some((t) => t.target === target);
}
