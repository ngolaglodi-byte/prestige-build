// lib/build/buildQueue.ts

import type { BuildTarget, BuildStatus, BuildOptions } from "./buildTargets";

export interface QueuedBuild {
  buildId: string;
  projectId: string;
  userId: string;
  target: BuildTarget;
  options: BuildOptions;
  status: BuildStatus;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  artifactUrl?: string;
  errorMessage?: string;
  progress: number;
  logs: string[];
}

const MAX_CONCURRENT_BUILDS = parseInt(
  process.env.BUILD_MAX_CONCURRENT ?? "3",
  10
);

// In-memory queue and active builds (for single-process environments)
const buildQueue: QueuedBuild[] = [];
const activeBuilds = new Map<string, QueuedBuild>();
const allBuilds = new Map<string, QueuedBuild>();

type BuildRunner = (
  build: QueuedBuild,
  onLog: (msg: string, type?: "info" | "error" | "warn") => void,
  onProgress: (progress: number) => void
) => Promise<string>;

let registeredRunner: BuildRunner | null = null;

export function registerBuildRunner(runner: BuildRunner): void {
  registeredRunner = runner;
}

export function enqueueBuild(
  projectId: string,
  userId: string,
  target: BuildTarget,
  options: BuildOptions = {},
  isEnterprise = false
): QueuedBuild {
  const buildId = crypto.randomUUID();
  const build: QueuedBuild = {
    buildId,
    projectId,
    userId,
    target,
    options,
    status: "queued",
    priority: isEnterprise ? 10 : 0,
    createdAt: new Date(),
    progress: 0,
    logs: [],
  };

  buildQueue.push(build);
  buildQueue.sort((a, b) => b.priority - a.priority);
  allBuilds.set(buildId, build);

  // Try to start next build
  processQueue();

  return build;
}

export function getBuild(buildId: string): QueuedBuild | undefined {
  return allBuilds.get(buildId);
}

export function getUserBuilds(userId: string): QueuedBuild[] {
  return Array.from(allBuilds.values()).filter((b) => b.userId === userId);
}

export function getProjectBuilds(projectId: string): QueuedBuild[] {
  return Array.from(allBuilds.values())
    .filter((b) => b.projectId === projectId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function cancelBuild(buildId: string): boolean {
  const build = allBuilds.get(buildId);
  if (!build) return false;

  if (build.status === "queued") {
    build.status = "cancelled";
    const idx = buildQueue.findIndex((b) => b.buildId === buildId);
    if (idx !== -1) buildQueue.splice(idx, 1);
    return true;
  }

  if (build.status === "building") {
    build.status = "cancelled";
    activeBuilds.delete(buildId);
    processQueue();
    return true;
  }

  return false;
}

export function getActiveBuildCount(userId: string): number {
  return Array.from(activeBuilds.values()).filter((b) => b.userId === userId)
    .length;
}

export function canUserBuild(userId: string): boolean {
  const userActive = getActiveBuildCount(userId);
  return userActive < 2 && activeBuilds.size < MAX_CONCURRENT_BUILDS;
}

function processQueue(): void {
  if (activeBuilds.size >= MAX_CONCURRENT_BUILDS) return;
  if (buildQueue.length === 0) return;
  if (!registeredRunner) return;

  const next = buildQueue.shift();
  if (!next) return;

  // Check if cancelled while in queue
  if (next.status === "cancelled") {
    processQueue();
    return;
  }

  next.status = "building";
  next.startedAt = new Date();
  activeBuilds.set(next.buildId, next);

  const onLog = (msg: string, type?: "info" | "error" | "warn") => {
    next.logs.push(`[${type ?? "info"}] ${msg}`);
  };

  const onProgress = (progress: number) => {
    next.progress = progress;
  };

  registeredRunner(next, onLog, onProgress)
    .then((artifactUrl) => {
      if (next.status !== "cancelled") {
        next.status = "success";
        next.artifactUrl = artifactUrl;
        next.progress = 100;
      }
    })
    .catch((err: Error) => {
      if (next.status !== "cancelled") {
        next.status = "failed";
        next.errorMessage = err.message;
        onLog(`❌ Build échoué : ${err.message}`, "error");
      }
    })
    .finally(() => {
      next.completedAt = new Date();
      activeBuilds.delete(next.buildId);
      processQueue();
    });
}
