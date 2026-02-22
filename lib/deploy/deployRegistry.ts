// lib/deploy/deployRegistry.ts

type DeployState = {
  status: "idle" | "building" | "uploading" | "deploying" | "success" | "failed";
  logs: string;
  url?: string;
};

const deployments = new Map<string, DeployState>();

export function setDeployState(projectId: string, state: DeployState) {
  deployments.set(projectId, state);
}

export function getDeployState(projectId: string) {
  return deployments.get(projectId);
}
