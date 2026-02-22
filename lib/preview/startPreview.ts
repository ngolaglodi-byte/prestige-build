import { detectFramework } from "./frameworkDetector";
import { registerProcess } from "./processRegistry";
import { getProjectRoot } from "@/lib/projects/fileSystem";
import { spawn } from "child_process";

export async function startPreview(projectId: string) {
  const root = getProjectRoot(projectId);
  const framework = detectFramework(root);

  const port = 40000 + Math.floor(Math.random() * 20000);

  let command = "";
  let args: string[] = [];

  switch (framework) {
    case "nextjs":
      command = "npm";
      args = ["run", "dev", "--", "-p", port.toString()];
      break;

    case "vite":
      command = "npm";
      args = ["run", "dev", "--", "--port", port.toString()];
      break;

    case "express":
      command = "node";
      args = ["server.js"];
      break;

    default:
      throw new Error("Unsupported framework");
  }

  const proc = spawn(command, args, {
    cwd: root,
    shell: true,
  });

  registerProcess(projectId, proc, port);

  return { port, pid: proc.pid };
}
