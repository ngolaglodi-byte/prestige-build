import { ChildProcess } from "child_process";

const processes = new Map<string, { proc: ChildProcess; port: number }>();

export function registerProcess(projectId: string, proc: ChildProcess, port: number) {
  processes.set(projectId, { proc, port });
}

export function getProcessForProject(projectId: string) {
  return processes.get(projectId);
}

export function removeProcess(projectId: string) {
  processes.delete(projectId);
}
