// lib/preview/processSupervisor.ts

import type { ChildProcessWithoutNullStreams } from "child_process";
import pidusage from "pidusage";
import { sendHotReloadEvent } from "./previewHotReload";

type Limits = {
  maxCpuPercent: number; // ex: 200 = 2 cores
  maxMemoryBytes: number; // ex: 512 * 1024 * 1024 = 512MB
};

type SupervisedProcess = {
  projectId: string;
  proc: ChildProcessWithoutNullStreams;
  limits: Limits;
  intervalId: NodeJS.Timeout;
};

const supervised = new Map<string, SupervisedProcess>();

export function superviseProcess(
  projectId: string,
  proc: ChildProcessWithoutNullStreams,
  limits: Limits
) {
  // Si déjà supervisé, on nettoie
  if (supervised.has(projectId)) {
    const prev = supervised.get(projectId)!;
    clearInterval(prev.intervalId);
    supervised.delete(projectId);
  }

  const intervalId = setInterval(async () => {
    try {
      const stats = await pidusage(proc.pid!);

      const cpu = stats.cpu; // %
      const mem = stats.memory; // bytes

      if (cpu > limits.maxCpuPercent || mem > limits.maxMemoryBytes) {
        sendHotReloadEvent(projectId, {
          event: "resource_limit_exceeded",
          cpu,
          mem,
        });

        proc.kill();

        supervised.delete(projectId);
        clearInterval(intervalId);
      }
    } catch {
      // Si le process est déjà mort, on arrête la supervision
      supervised.delete(projectId);
      clearInterval(intervalId);
    }
  }, 3000);

  supervised.set(projectId, {
    projectId,
    proc,
    limits,
    intervalId,
  });
}

export function stopSupervision(projectId: string) {
  const entry = supervised.get(projectId);
  if (!entry) return;

  clearInterval(entry.intervalId);
  supervised.delete(projectId);
}
