// lib/preview/stopPreview.ts
import { getProcessForProject, removeProcess } from "./processRegistry";
import { stopWatcher } from "./watcher";

export async function stopPreview(projectId: string) {
  const entry = getProcessForProject(projectId);
  if (!entry) return;

  try {
    entry.proc.kill();
  } catch (e) {
    console.error("Error killing process", e);
  }

  removeProcess(projectId);
  stopWatcher(projectId);
}
