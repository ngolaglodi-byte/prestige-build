// lib/build/electronBuilder.ts

import path from "path";
import { runInSandbox } from "@/lib/preview/sandbox";
import type { BuildTarget } from "./buildTargets";

export type LogCallback = (msg: string, type?: "info" | "error" | "warn") => void;

async function runStep(
  projectId: string,
  cmd: "npx" | "npm" | "node",
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

function getElectronBuilderTarget(target: BuildTarget): string {
  switch (target) {
    case "windows-exe":
      return "--win --x64";
    case "windows-msi":
      return "--win --x64";
    case "macos-dmg":
      return "--mac --x64";
    case "linux-appimage":
      return "--linux AppImage";
    case "linux-deb":
      return "--linux deb";
    default:
      throw new Error(`Cible Electron non reconnue : ${target}`);
  }
}

function getExpectedOutputPath(
  projectPath: string,
  target: BuildTarget,
  appName: string
): string {
  const distDir = path.join(projectPath, "dist");

  switch (target) {
    case "windows-exe":
      return path.join(distDir, `${appName} Setup.exe`);
    case "windows-msi":
      return path.join(distDir, `${appName}.msi`);
    case "macos-dmg":
      return path.join(distDir, `${appName}.dmg`);
    case "linux-appimage":
      return path.join(distDir, `${appName}.AppImage`);
    case "linux-deb":
      return path.join(distDir, `${appName}.deb`);
    default:
      return distDir;
  }
}

export async function buildWithElectron(
  projectId: string,
  target: BuildTarget,
  onLog: LogCallback,
  options: { appName?: string } = {}
): Promise<string> {
  const projectPath = path.join(process.cwd(), "workspace", projectId);
  const appName = options.appName ?? "app";

  onLog("📦 Installation de electron-builder…", "info");
  await runStep(
    projectId,
    "npm",
    ["install", "--save-dev", "electron-builder"],
    onLog
  );

  onLog("🔨 Build web avant packaging Electron…", "info");
  await runStep(projectId, "npm", ["run", "build"], onLog);

  const builderTarget = getElectronBuilderTarget(target);
  const builderArgs = ["electron-builder", ...builderTarget.split(" ")];

  onLog(`🚀 Packaging Electron pour ${target}…`, "info");
  await runStep(projectId, "npx", builderArgs, onLog);

  const outputPath = getExpectedOutputPath(projectPath, target, appName);
  onLog(`✅ Build Electron terminé : ${outputPath}`, "info");
  return outputPath;
}
