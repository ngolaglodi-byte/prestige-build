const processes = new Map<string, { proc: any; port: number }>();

export function registerProcess(projectId: string, proc: any, port: number) {
  processes.set(projectId, { proc, port });
}

export function getProcessForProject(projectId: string) {
  return processes.get(projectId);
}

export function removeProcess(projectId: string) {
  processes.delete(projectId);
}
