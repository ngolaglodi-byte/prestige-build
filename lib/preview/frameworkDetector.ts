import fs from "fs";
import path from "path";

export type Framework =
  | "nextjs"
  | "vite"
  | "cra"
  | "express"
  | "astro"
  | "sveltekit"
  | "unknown";

export function detectFramework(projectPath: string): Framework {
  const pkgPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(pkgPath)) return "unknown";

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps["next"]) return "nextjs";
  if (deps["vite"]) return "vite";
  if (deps["react-scripts"]) return "cra";
  if (deps["express"]) return "express";
  if (deps["astro"]) return "astro";
  if (deps["@sveltejs/kit"]) return "sveltekit";

  return "unknown";
}
