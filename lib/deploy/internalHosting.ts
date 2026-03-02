// lib/deploy/internalHosting.ts
// Internal deployment system that uploads build artefacts to Supabase Storage,
// generating a public URL for static hosting on Prestige Cloud.

import { getSupabaseServiceClient } from "@/lib/supabase";
import { setDeployState } from "./deployRegistry";
import { buildProject } from "./buildProject";
import fs from "fs";
import path from "path";

const BUCKET_NAME = "deployments";

export interface InternalDeployResult {
  url: string;
  filesUploaded: number;
}

/**
 * Deploy a project to Prestige Cloud (Supabase Storage).
 * Builds the project, uploads artefacts, and returns a public URL.
 */
export async function deployInternal(
  projectId: string
): Promise<InternalDeployResult> {
  setDeployState(projectId, {
    status: "building",
    logs: "Construction du projet…\n",
  });

  const build = await buildProject(projectId);

  if (!build.success) {
    setDeployState(projectId, { status: "failed", logs: build.logs });
    throw new Error(`Build failed: ${build.logs}`);
  }

  setDeployState(projectId, {
    status: "uploading",
    logs: build.logs + "\nUpload vers Prestige Cloud…\n",
  });

  const supabase = getSupabaseServiceClient();

  // Ensure the bucket exists (idempotent)
  await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    allowedMimeTypes: ["*/*"],
  });

  // Collect files from the build output
  const files = collectBuildFiles(build.outputDir!);

  // Upload each file
  const slug = projectId.replace(/[^a-zA-Z0-9-_]/g, "_");
  let uploaded = 0;

  for (const file of files) {
    const storagePath = `${slug}/${file.relativePath}`;
    const content = fs.readFileSync(file.absolutePath);

    await supabase.storage.from(BUCKET_NAME).upload(storagePath, content, {
      upsert: true,
      contentType: guessMime(file.relativePath),
      cacheControl: "public, max-age=31536000, immutable",
    });

    uploaded++;
  }

  const publicUrl = `https://${slug}.prestige.app`;

  setDeployState(projectId, {
    status: "success",
    logs: build.logs + `\n${uploaded} fichiers uploadés.\nURL: ${publicUrl}`,
    url: publicUrl,
  });

  return { url: publicUrl, filesUploaded: uploaded };
}

// ── Helpers ──────────────────────────────────────────────────────────────

interface BuildFile {
  relativePath: string;
  absolutePath: string;
}

function collectBuildFiles(dir: string): BuildFile[] {
  const result: BuildFile[] = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current);
    for (const entry of entries) {
      const full = path.join(current, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else {
        result.push({
          relativePath: path.relative(dir, full),
          absolutePath: full,
        });
      }
    }
  }

  walk(dir);
  return result;
}

function guessMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".map": "application/json",
  };
  return map[ext] ?? "application/octet-stream";
}
