// lib/build/sandboxRunner.ts

import { runInSandbox } from "@/lib/preview/sandbox";

export type LogCallback = (msg: string, type?: "info" | "error" | "warn") => void;

type AllowedCommand = "npm" | "node" | "npx" | "gradle" | "xcodebuild" | "cargo";

export async function runSandboxStep(
  projectId: string,
  cmd: AllowedCommand,
  args: string[],
  onLog: LogCallback,
  timeoutMs?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = runInSandbox({ projectId, cmd, args });
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs && timeoutMs > 0) {
      timer = setTimeout(() => {
        proc.kill("SIGKILL");
        reject(new Error(`Build timed out after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`));
      }, timeoutMs);
    }

    proc.stdout.on("data", (d) => onLog(d.toString().trim(), "info"));
    proc.stderr.on("data", (d) => onLog(d.toString().trim(), "warn"));

    proc.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}: ${cmd} ${args.join(" ")}`));
    });

    proc.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
  });
}
