// lib/build/tauriBuilder.ts

import path from "path";
import { runSandboxStep, type LogCallback } from "./sandboxRunner";
import type { BuildTarget } from "./buildTargets";

export type { LogCallback };

export async function buildWithTauri(
  projectId: string,
  target: BuildTarget,
  onLog: LogCallback
): Promise<string> {
  const projectPath = path.join(process.cwd(), "workspace", projectId);

  onLog("🦀 Installation de Tauri CLI…", "info");
  await runSandboxStep(
    projectId,
    "npm",
    ["install", "--save-dev", "@tauri-apps/cli"],
    onLog
  );

  onLog("🔨 Build avec Tauri…", "info");
  await runSandboxStep(projectId, "npx", ["tauri", "build"], onLog);

  // Chemin de sortie Tauri par défaut
  const tauriTarget = path.join(
    projectPath,
    "src-tauri",
    "target",
    "release",
    "bundle"
  );

  let outputFile = tauriTarget;

  if (target === "macos-app") {
    outputFile = path.join(tauriTarget, "macos");
  } else if (target === "windows-exe") {
    outputFile = path.join(tauriTarget, "msi");
  } else if (target === "linux-appimage") {
    outputFile = path.join(tauriTarget, "appimage");
  } else if (target === "linux-deb") {
    outputFile = path.join(tauriTarget, "deb");
  }

  onLog(`✅ Build Tauri terminé : ${outputFile}`, "info");
  return outputFile;
}
