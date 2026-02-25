// lib/build/artifactManager.ts

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ArtifactMetadata {
  buildId: string;
  projectId: string;
  target: string;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  createdAt: Date;
  expiresAt: Date;
}

const ARTIFACTS_BASE_PATH =
  process.env.BUILD_ARTIFACTS_PATH ??
  path.join(process.cwd(), "workspace", "artifacts");

const RETENTION_DAYS = parseInt(
  process.env.BUILD_ARTIFACT_RETENTION_DAYS ?? "30",
  10
);

export function getArtifactDir(
  projectId: string,
  buildId: string
): string {
  return path.join(ARTIFACTS_BASE_PATH, projectId, buildId);
}

export function ensureArtifactDir(
  projectId: string,
  buildId: string
): string {
  const dir = getArtifactDir(projectId, buildId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function storeArtifact(
  projectId: string,
  buildId: string,
  sourcePath: string,
  target: string
): ArtifactMetadata {
  const artifactDir = ensureArtifactDir(projectId, buildId);
  const fileName = path.basename(sourcePath);
  const destPath = path.join(artifactDir, fileName);

  fs.copyFileSync(sourcePath, destPath);

  const stat = fs.statSync(destPath);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);

  return {
    buildId,
    projectId,
    target,
    filePath: destPath,
    fileName,
    sizeBytes: stat.size,
    createdAt: new Date(),
    expiresAt,
  };
}

export function generateDownloadToken(
  buildId: string,
  projectId: string
): string {
  const secret = process.env.CLERK_SECRET_KEY ?? "prestige-build-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${buildId}:${projectId}`)
    .digest("hex")
    .slice(0, 32);
}

export function getArtifactPath(
  projectId: string,
  buildId: string
): string | null {
  const artifactDir = getArtifactDir(projectId, buildId);
  if (!fs.existsSync(artifactDir)) return null;

  const files = fs.readdirSync(artifactDir);
  if (files.length === 0) return null;

  return path.join(artifactDir, files[0]);
}

export function deleteArtifacts(
  projectId: string,
  buildId: string
): void {
  const artifactDir = getArtifactDir(projectId, buildId);
  if (fs.existsSync(artifactDir)) {
    fs.rmSync(artifactDir, { recursive: true, force: true });
  }
}

export function cleanExpiredArtifacts(): void {
  if (!fs.existsSync(ARTIFACTS_BASE_PATH)) return;

  const now = new Date();

  const projectDirs = fs.readdirSync(ARTIFACTS_BASE_PATH);
  for (const projectId of projectDirs) {
    const projectDir = path.join(ARTIFACTS_BASE_PATH, projectId);
    if (!fs.statSync(projectDir).isDirectory()) continue;

    const buildDirs = fs.readdirSync(projectDir);
    for (const buildId of buildDirs) {
      const buildDir = path.join(projectDir, buildId);
      const stat = fs.statSync(buildDir);

      const ageMs = now.getTime() - stat.birthtime.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays > RETENTION_DAYS) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }
    }
  }
}
