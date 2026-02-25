import fs from "fs";
import path from "path";

export type Framework =
  | "nextjs"
  | "vite"
  | "cra"
  | "express"
  | "astro"
  | "sveltekit"
  | "capacitor"
  | "electron"
  | "tauri"
  | "pwa"
  | "unknown";

export function detectFramework(projectPath: string): Framework {
  const pkgPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(pkgPath)) return "unknown";

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Check for native/hybrid frameworks first (more specific)
  if (deps["@capacitor/core"] || deps["@capacitor/android"] || deps["@capacitor/ios"]) return "capacitor";
  if (deps["electron"] || deps["electron-builder"]) return "electron";
  if (deps["@tauri-apps/api"]) return "tauri";

  // Check for PWA
  const hasPwaLib = deps["next-pwa"] || deps["workbox-webpack-plugin"] || deps["@vite-pwa/vite"];
  const manifestPath = path.join(projectPath, "public", "manifest.json");
  const swPath = path.join(projectPath, "public", "sw.js");
  if (hasPwaLib || fs.existsSync(manifestPath) || fs.existsSync(swPath)) return "pwa";

  if (deps["next"]) return "nextjs";
  if (deps["vite"]) return "vite";
  if (deps["react-scripts"]) return "cra";
  if (deps["express"]) return "express";
  if (deps["astro"]) return "astro";
  if (deps["@sveltejs/kit"]) return "sveltekit";

  return "unknown";
}
