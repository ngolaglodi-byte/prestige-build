// lib/preview/streamLogs.ts
import { getProcessForProject } from "./processRegistry";

export function streamLogs(projectId: string) {
  const entry = getProcessForProject(projectId);
  if (!entry) return null;
  return entry.proc;
}
