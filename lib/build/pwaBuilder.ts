// lib/build/pwaBuilder.ts

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { runInSandbox } from "@/lib/preview/sandbox";
import { ensureArtifactDir } from "./artifactManager";

export type LogCallback = (msg: string, type?: "info" | "error" | "warn") => void;

export interface PwaOptions {
  name?: string;
  shortName?: string;
  themeColor?: string;
  backgroundColor?: string;
  startUrl?: string;
}

async function runBuild(
  projectId: string,
  onLog: LogCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
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
}

function generateManifest(options: PwaOptions): object {
  return {
    name: options.name ?? "Mon Application",
    short_name: options.shortName ?? options.name ?? "App",
    start_url: options.startUrl ?? "/",
    display: "standalone",
    background_color: options.backgroundColor ?? "#ffffff",
    theme_color: options.themeColor ?? "#000000",
    description: "Application Progressive Web App",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

function generateServiceWorker(): string {
  return `// Service Worker généré par Prestige Build
const CACHE_NAME = 'prestige-pwa-v1';
const urlsToCache = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});
`;
}

export async function buildPwa(
  projectId: string,
  buildId: string,
  onLog: LogCallback,
  options: PwaOptions = {}
): Promise<string> {
  const projectPath = path.join(process.cwd(), "workspace", projectId);

  onLog("🌐 Lancement du build web…", "info");
  await runBuild(projectId, onLog);

  // Déterminer le dossier de sortie (out, dist, build, .next/static…)
  const outCandidates = ["out", "dist", "build", ".next"];
  let outDir: string | null = null;

  for (const candidate of outCandidates) {
    const candidatePath = path.join(projectPath, candidate);
    if (fs.existsSync(candidatePath)) {
      outDir = candidatePath;
      break;
    }
  }

  if (!outDir) {
    throw new Error(
      "Dossier de sortie introuvable (out, dist, build, .next)"
    );
  }

  // Injecter/mettre à jour le manifest.json
  const manifestPath = path.join(outDir, "manifest.json");
  const manifest = generateManifest(options);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  onLog("📄 Manifest PWA généré", "info");

  // Injecter le service worker si absent
  const swPath = path.join(outDir, "sw.js");
  if (!fs.existsSync(swPath)) {
    fs.writeFileSync(swPath, generateServiceWorker());
    onLog("⚙️ Service worker généré", "info");
  }

  // Créer une archive ZIP du dossier de sortie
  const artifactDir = ensureArtifactDir(projectId, buildId);
  const zipPath = path.join(artifactDir, "pwa.zip");

  onLog("📦 Création de l'archive PWA…", "info");

  // Simple archive avec tar (disponible sur Linux)
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

  onLog(`✅ Build PWA terminé : ${zipPath}`, "info");
  return zipPath;
}
