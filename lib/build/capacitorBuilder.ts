// lib/build/capacitorBuilder.ts

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
        reject(new Error(`Commande échouée avec le code ${code}: ${cmd} ${args.join(" ")}`));
      }
    });

    proc.on("error", reject);
  });
}

export async function buildWithCapacitor(
  projectId: string,
  target: BuildTarget,
  onLog: LogCallback
): Promise<string> {
  const projectPath = path.join(process.cwd(), "workspace", projectId);

  onLog("🔧 Initialisation de Capacitor…", "info");
  await runStep(projectId, "npm", ["install", "@capacitor/core", "@capacitor/cli"], onLog);

  onLog("📦 Build web avant sync Capacitor…", "info");
  await runStep(projectId, "npm", ["run", "build"], onLog);

  onLog("🔄 Synchronisation des assets web…", "info");
  await runStep(projectId, "npx", ["cap", "sync"], onLog);

  if (target === "android-apk" || target === "android-aab") {
    onLog("📱 Ajout de la plateforme Android…", "info");
    await runStep(projectId, "npx", ["cap", "add", "android"], onLog);

    const gradleTask =
      target === "android-aab" ? "bundleRelease" : "assembleRelease";

    onLog(`🔨 Build Android (${gradleTask})…`, "info");
    await runStep(
      projectId,
      "npm",
      ["run", "build:android", "--", `--gradle-task=${gradleTask}`],
      onLog
    );

    const ext = target === "android-aab" ? ".aab" : ".apk";
    const outputPath = path.join(
      projectPath,
      "android",
      "app",
      "build",
      "outputs",
      target === "android-aab" ? "bundle" : "apk",
      "release",
      `app-release${ext}`
    );

    onLog(`✅ Build Android terminé : ${outputPath}`, "info");
    return outputPath;
  }

  if (target === "ios-ipa") {
    onLog("🍎 Ajout de la plateforme iOS…", "info");
    await runStep(projectId, "npx", ["cap", "add", "ios"], onLog);

    onLog("🔨 Build iOS (xcodebuild)…", "info");
    await runStep(
      projectId,
      "npx",
      ["cap", "build", "ios", "--", "--no-open"],
      onLog
    );

    const outputPath = path.join(projectPath, "ios", "build", "App.ipa");
    onLog(`✅ Build iOS terminé : ${outputPath}`, "info");
    return outputPath;
  }

  throw new Error(`Cible non supportée par Capacitor : ${target}`);
}
