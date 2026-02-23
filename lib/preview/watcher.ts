// lib/preview/watcher.ts
import chokidar, { FSWatcher } from "chokidar";
import { previewManager } from "./previewManager";
import { getProjectRoot } from "@/lib/projects/fileSystem";

const watchers = new Map<string, FSWatcher>();

export function startWatcher(projectId: string) {
  if (watchers.has(projectId)) return;

  const root = getProjectRoot(projectId);

  const watcher = chokidar.watch(root, {
    ignored: ["node_modules", ".next", "dist", ".git"],
    ignoreInitial: true,
  });

  watcher.on("all", async () => {
    console.log(`[Watcher] Change detected in ${projectId}, restarting preview...`);
    await previewManager.stop(projectId);
    await previewManager.start(projectId);
  });

  watchers.set(projectId, watcher);
}

export function stopWatcher(projectId: string) {
  const watcher = watchers.get(projectId);
  if (watcher) {
    watcher.close();
    watchers.delete(projectId);
  }
}
