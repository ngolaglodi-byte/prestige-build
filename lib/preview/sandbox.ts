// lib/preview/sandbox.ts

import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import fs from "fs";
import { buildNetworkSandboxEnv } from "./networkSandbox";

type AllowedCommand = "npm" | "node" | "npx" | "gradle" | "xcodebuild" | "cargo";

const ALLOWED_COMMANDS: AllowedCommand[] = ["npm", "node", "npx", "gradle", "xcodebuild", "cargo"];

export type SandboxProcess = ChildProcessWithoutNullStreams;

type SandboxOptions = {
  projectId: string;
  cmd: AllowedCommand;
  args: string[];
  env?: Record<string, string>;
};

export function runInSandbox(options: SandboxOptions): SandboxProcess {
  const { projectId, cmd, args, env } = options;

  if (!ALLOWED_COMMANDS.includes(cmd)) {
    throw new Error(`Command not allowed in sandbox: ${cmd}`);
  }

  const projectPath = path.join(process.cwd(), "workspace", projectId);

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project folder not found for sandbox: ${projectId}`);
  }

  // Base env
  const baseEnv = {
    ...process.env,
    ...(env || {}),
    PROJECT_ID: projectId,
  };

  // 🔥 Application de la sandbox réseau
  const sandboxEnv = buildNetworkSandboxEnv(baseEnv, projectId);

  const child = spawn(cmd, args, {
    cwd: projectPath,
    shell: true,
    env: sandboxEnv,
  });

  return child;
}
