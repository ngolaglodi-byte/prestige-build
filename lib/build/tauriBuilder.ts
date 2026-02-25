// lib/build/tauriBuilder.ts

import path from "path";
import { runInSandbox } from "@/lib/preview/sandbox";
import type { BuildTarget } from "./buildTargets";

export type LogCallback = (msg: string, type?: "info" | "error" | "warn") => void;

async function runStep(
  projectId: string,
  cmd: "npx" | "npm" | "node" | "cargo",
  args: string[],
  onLog: LogCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = runInSandbox({ projectId, cmd, args });

    proc.stdout.on("data", (d) => onLog(d.toString().trim(), "info"));
    proc.stderr.on("data", (d) => onLog(d.toString().trim(), "warn"));

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Commande échouée avec le code ${code}: ${cmd} ${args.join(" ")}`
          )
        );
      }
    });

    proc.on("error", reject);
  });
}

export async function buildWithTauri(
  projectId: string,
  target: BuildTarget,
  onLog: LogCallback
): Promise<string> {
  const projectPath = path.join(process.cwd(), "workspace", projectId);

  onLog("🦀 Installation de Tauri CLI…", "info");
  await runStep(
    projectId,
    "npm",
    ["install", "--save-dev", "@tauri-apps/cli"],
    onLog
  );

  onLog("🔨 Build avec Tauri…", "info");
  await runStep(projectId, "npx", ["tauri", "build"], onLog);

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
