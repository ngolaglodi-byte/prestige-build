// lib/preview/previewEngine.ts

import chokidar from "chokidar";
import path from "path";
import fs from "fs";

import { detectFramework } from "./frameworkDetector";
import { getFrameworkCommand } from "./frameworkCommands";
import { parseBuildError } from "./errorParser";
import { initHotReloadServer, sendHotReloadEvent } from "./previewHotReload";
import { runInSandbox, SandboxProcess } from "./sandbox";
import { superviseProcess, stopSupervision } from "./processSupervisor";
import {
  canStartPreview,
  registerPreviewStart,
  registerPreviewStop,
  getUserResourceLimits,
} from "./quotaManager";

type PreviewProcess = {
  process: SandboxProcess;
  port: number;
  watcher: chokidar.FSWatcher;
};

const previewProcesses = new Map<string, PreviewProcess>();

// 🔥 Idle management
const idleTimers = new Map<string, NodeJS.Timeout>();
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function getFreePort(): number {
  return 3000 + Math.floor(Math.random() * 5000);
}

function getKey(userId: string, projectId: string): string {
  return `${userId}:${projectId}`;
}

function clearIdleTimer(key: string) {
  const t = idleTimers.get(key);
  if (t) {
    clearTimeout(t);
    idleTimers.delete(key);
  }
}

function scheduleIdleStop(userId: string, projectId: string) {
  const key = getKey(userId, projectId);
  clearIdleTimer(key);

  const timeout = setTimeout(() => {
    const entry = previewProcesses.get(key);
    if (!entry) return;

    // Stop preview pour idle
    stopPreviewServer(userId, projectId);

    // Notifier le frontend
    sendHotReloadEvent(key, { event: "stopped_idle" });
  }, IDLE_TIMEOUT_MS);

  idleTimers.set(key, timeout);
}

// 🔥 appelé par l’API heartbeat
export function registerHeartbeat(userId: string, projectId: string) {
  scheduleIdleStop(userId, projectId);
}

export async function startPreviewServer(userId: string, projectId: string) {
  initHotReloadServer();

  const key = getKey(userId, projectId);

  // Déjà lancé → renvoyer le port + refresh idle
  if (previewProcesses.has(key)) {
    scheduleIdleStop(userId, projectId);
    return { ok: true, port: previewProcesses.get(key)!.port };
  }

  // 🔥 Quota par user (DB + cache)
  if (!(await canStartPreview(userId))) {
    sendHotReloadEvent(key, { event: "limit_reached" });
    return { ok: false, reason: "limit_reached" as const };
  }

  const projectPath = path.join(process.cwd(), "workspace", projectId);

  if (!fs.existsSync(projectPath)) {
    throw new Error("Project folder not found");
  }

  const port = getFreePort();

  const framework = detectFramework(projectPath);
  console.log(`[Preview] Framework detected for ${key}: ${framework}`);

  const { cmd, args, env } = getFrameworkCommand(framework, port);

  // 🔥 Sandbox process
  const child = runInSandbox({
    projectId,
    cmd: cmd as "npm" | "node",
    args,
    env,
  });

  // 🔥 Limites CPU/RAM par user (plan / UserLimits)
  const limits = await getUserResourceLimits(userId);

  superviseProcess(key, child, {
    maxCpuPercent: limits.maxCpuPercent,
    maxMemoryBytes: limits.maxMemoryBytes,
  });

  // 🔥 Watcher auto-restart
  const watcher = chokidar.watch(projectPath, {
    ignored: ["node_modules", ".next", "dist"],
    ignoreInitial: true,
  });

  watcher.on("all", () => {
    console.log(`[Preview] File changed → restarting server for ${key}`);

    sendHotReloadEvent(key, { event: "restarting" });

    stopPreviewServer(userId, projectId);

    const newChild = runInSandbox({
      projectId,
      cmd: cmd as "npm" | "node",
      args,
      env,
    });

    superviseProcess(key, newChild, {
      maxCpuPercent: limits.maxCpuPercent,
      maxMemoryBytes: limits.maxMemoryBytes,
    });

    previewProcesses.set(key, {
      process: newChild,
      port,
      watcher,
    });

    scheduleIdleStop(userId, projectId);
  });

  previewProcesses.set(key, { process: child, port, watcher });
  registerPreviewStart(userId);
  scheduleIdleStop(userId, projectId);

  return { ok: true, port };
}

export function getPreviewLogs(
  userId: string,
  projectId: string,
  onData: (msg: string, type: "info" | "warn" | "error") => void
) {
  const key = getKey(userId, projectId);
  const entry = previewProcesses.get(key);
  if (!entry) return;

  // STDOUT → info / error + trigger reload
  entry.process.stdout.on("data", (data) => {
    const msg = data.toString();
    const error = parseBuildError(msg);

    if (error) {
      onData(error, "error");
    } else {
      onData(msg, "info");
    }

    const lower = msg.toLowerCase();

    if (
      lower.includes("compiled") ||
      lower.includes("ready") ||
      lower.includes("server running")
    ) {
      sendHotReloadEvent(key, { event: "reload" });
    }
  });

  // STDERR → warn / error
  entry.process.stderr.on("data", (data) => {
    const msg = data.toString();
    const error = parseBuildError(msg);

    if (error) {
      onData(error, "error");
    } else {
      onData(msg, "warn");
    }
  });

  // 🔥 Crash
  entry.process.on("exit", (code, signal) => {
    sendHotReloadEvent(key, {
      event: "crashed",
      code,
      signal,
    });
  });
}

export function stopPreviewServer(userId: string, projectId: string) {
  const key = getKey(userId, projectId);
  const entry = previewProcesses.get(key);
  if (!entry) return;

  stopSupervision(key);
  clearIdleTimer(key);

  entry.process.kill();
  entry.watcher.close();
  previewProcesses.delete(key);
  registerPreviewStop(userId);
}
