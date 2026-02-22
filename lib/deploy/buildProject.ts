// lib/deploy/buildProject.ts
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { detectFramework } from "@/lib/preview/frameworkDetector";
import { getProjectRoot } from "@/lib/projects/fileSystem";

export async function buildProject(projectId: string) {
  const root = getProjectRoot(projectId);
  const framework = detectFramework(root);

  let command = "npm";
  let args = ["run", "build"];
  let outputDir = "";

  switch (framework) {
    case "nextjs":
      outputDir = path.join(root, ".next");
      break;

    case "vite":
    case "astro":
      outputDir = path.join(root, "dist");
      break;

    default:
      return { success: false, logs: `Unsupported framework: ${framework}` };
  }

  let logs = "";
  const proc = spawn(command, args, { cwd: root, shell: true });

  return await new Promise<{ success: boolean; outputDir?: string; logs: string }>((resolve) => {
    proc.stdout.on("data", (c) => (logs += c.toString()));
    proc.stderr.on("data", (c) => (logs += c.toString()));

    proc.on("close", () => {
      const success = fs.existsSync(outputDir);
      resolve({ success, outputDir, logs });
    });
  });
}
