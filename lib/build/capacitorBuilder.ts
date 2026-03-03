// lib/build/capacitorBuilder.ts

import path from "path";
import { runSandboxStep, type LogCallback } from "./sandboxRunner";
import type { BuildTarget } from "./buildTargets";

export type { LogCallback };

export async function buildWithCapacitor(
  projectId: string,
  target: BuildTarget,
  onLog: LogCallback
): Promise<string> {
  const projectPath = path.join(process.cwd(), "workspace", projectId);

  onLog("🔧 Initialisation de Capacitor…", "info");
  await runSandboxStep(projectId, "npm", ["install", "@capacitor/core", "@capacitor/cli"], onLog);

  onLog("📦 Build web avant sync Capacitor…", "info");
  await runSandboxStep(projectId, "npm", ["run", "build"], onLog);

  onLog("🔄 Synchronisation des assets web…", "info");
  await runSandboxStep(projectId, "npx", ["cap", "sync"], onLog);

  if (target === "android-apk" || target === "android-aab") {
    onLog("📱 Ajout de la plateforme Android…", "info");
    await runSandboxStep(projectId, "npx", ["cap", "add", "android"], onLog);

    const gradleTask =
      target === "android-aab" ? "bundleRelease" : "assembleRelease";

    onLog(`🔨 Build Android (${gradleTask})…`, "info");
    await runSandboxStep(
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
    await runSandboxStep(projectId, "npx", ["cap", "add", "ios"], onLog);

    onLog("🔨 Build iOS (xcodebuild)…", "info");
    await runSandboxStep(
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
