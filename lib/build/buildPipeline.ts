// lib/build/buildPipeline.ts

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import type { BuildTarget, BuildOptions } from "./buildTargets";
import { getBuildTargetConfig } from "./buildTargets";
import { buildWithCapacitor } from "./capacitorBuilder";
import { buildWithElectron } from "./electronBuilder";
import { buildWithTauri } from "./tauriBuilder";
import { buildPwa } from "./pwaBuilder";
import {
  storeArtifact,
  ensureArtifactDir,
} from "./artifactManager";
import {
  enqueueBuild,
  registerBuildRunner,
  getBuild,
  getProjectBuilds,
  cancelBuild,
  canUserBuild,
  type QueuedBuild,
} from "./buildQueue";

export type { QueuedBuild };

export type LogCallback = (
  msg: string,
  type?: "info" | "error" | "warn"
) => void;

// Register the build runner once
registerBuildRunner(async (build, onLog, onProgress) => {
  const { projectId, buildId, target, options } = build;

  onLog(`🚀 Démarrage du build ${target} pour le projet ${projectId}`, "info");
  onProgress(5);

  const targetConfig = getBuildTargetConfig(target);
  if (!targetConfig) {
    throw new Error(`Cible de build inconnue : ${target}`);
  }

  let artifactPath: string;

  onProgress(10);

  if (target === "android-apk" || target === "android-aab" || target === "ios-ipa") {
    artifactPath = await buildWithCapacitor(projectId, target, (msg, type) => {
      onLog(msg, type);
      onProgress(Math.min(90, build.progress + 5));
    });
  } else if (
    target === "windows-exe" ||
    target === "windows-msi" ||
    target === "linux-appimage" ||
    target === "linux-deb" ||
    (target === "macos-dmg")
  ) {
    artifactPath = await buildWithElectron(
      projectId,
      target,
      (msg, type) => {
        onLog(msg, type);
        onProgress(Math.min(90, build.progress + 5));
      },
      { appName: options.appName }
    );
  } else if (target === "macos-app") {
    artifactPath = await buildWithTauri(projectId, target, (msg, type) => {
      onLog(msg, type);
      onProgress(Math.min(90, build.progress + 5));
    });
  } else if (target === "pwa") {
    artifactPath = await buildPwa(
      projectId,
      buildId,
      (msg, type) => {
        onLog(msg, type);
        onProgress(Math.min(90, build.progress + 5));
      },
      {
        name: options.appName,
        themeColor: options.themeColor,
        backgroundColor: options.backgroundColor,
        startUrl: options.startUrl,
      }
    );
  } else if (target === "web") {
    artifactPath = await buildWebStatic(projectId, buildId, onLog);
    onProgress(90);
  } else {
    throw new Error(`Cible non gérée : ${target}`);
  }

  // Store the artifact and return the download path reference
  const metadata = storeArtifact(projectId, buildId, artifactPath, target);
  onProgress(100);
  onLog(`✅ Artefact stocké : ${metadata.fileName}`, "info");

  // Return a relative artifact identifier
  return `/api/projects/${projectId}/build/${buildId}/download`;
});

async function buildWebStatic(
  projectId: string,
  buildId: string,
  onLog: LogCallback
): Promise<string> {
  const { runInSandbox } = await import("@/lib/preview/sandbox");
  const projectPath = path.join(process.cwd(), "workspace", projectId);

  onLog("🌐 Build web statique…", "info");

  await new Promise<void>((resolve, reject) => {
    const proc = runInSandbox({
      projectId,
      cmd: "npm",
      args: ["run", "build"],
    });

    proc.stdout.on("data", (d) => onLog(d.toString().trim(), "info"));
    proc.stderr.on("data", (d) => onLog(d.toString().trim(), "warn"));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build web échoué (code ${code})`));
    });

    proc.on("error", reject);
  });

  // Create a zip of the output directory
  const outCandidates = ["out", "dist", "build"];
  let outDir: string | null = null;
  for (const candidate of outCandidates) {
    const p = path.join(projectPath, candidate);
    if (fs.existsSync(p)) {
      outDir = p;
      break;
    }
  }

  if (!outDir) {
    throw new Error("Dossier de sortie introuvable (out, dist, build)");
  }

  const artifactDir = ensureArtifactDir(projectId, buildId);
  const zipPath = path.join(artifactDir, "web.zip");

  await new Promise<void>((resolve, reject) => {
    const tar = spawn("tar", ["-czf", zipPath, "-C", outDir!, "."], {
      shell: true,
    });
    tar.on("close", (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`Archive échouée (code ${code})`));
    });
    tar.on("error", reject);
  });

  return zipPath;
}

export function startBuild(
  projectId: string,
  userId: string,
  target: BuildTarget,
  options: BuildOptions = {},
  isEnterprise = false
): QueuedBuild {
  if (!canUserBuild(userId)) {
    throw new Error(
      "Limite de builds simultanés atteinte. Veuillez patienter."
    );
  }

  return enqueueBuild(projectId, userId, target, options, isEnterprise);
}

export { getBuild, getProjectBuilds, cancelBuild, canUserBuild };
