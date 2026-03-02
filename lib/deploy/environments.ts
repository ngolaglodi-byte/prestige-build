/**
 * Deployment Environments — manages dev, preview, and production
 * environments for each project.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnvironmentType = "development" | "preview" | "production";

export type EnvironmentStatus =
  | "active"
  | "building"
  | "deploying"
  | "failed"
  | "stopped";

export interface Environment {
  id: string;
  projectId: string;
  type: EnvironmentType;
  status: EnvironmentStatus;
  url?: string;
  branch?: string;
  commitSha?: string;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
}

export interface EnvironmentConfig {
  type: EnvironmentType;
  branch: string;
  autoDeployEnabled: boolean;
  variables: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_ENV_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  development: {
    type: "development",
    branch: "dev",
    autoDeployEnabled: false,
    variables: { NODE_ENV: "development" },
  },
  preview: {
    type: "preview",
    branch: "preview",
    autoDeployEnabled: true,
    variables: { NODE_ENV: "preview" },
  },
  production: {
    type: "production",
    branch: "main",
    autoDeployEnabled: true,
    variables: { NODE_ENV: "production" },
  },
};

// ---------------------------------------------------------------------------
// Environment management
// ---------------------------------------------------------------------------

export function createEnvironment(
  projectId: string,
  type: EnvironmentType,
  overrides?: Partial<EnvironmentConfig>
): Environment {
  const defaults = DEFAULT_ENV_CONFIGS[type];
  const config = { ...defaults, ...overrides };

  return {
    id: crypto.randomUUID(),
    projectId,
    type,
    status: "stopped",
    branch: config.branch,
    variables: config.variables,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createAllEnvironments(
  projectId: string
): Environment[] {
  return (["development", "preview", "production"] as EnvironmentType[]).map(
    (type) => createEnvironment(projectId, type)
  );
}

// ---------------------------------------------------------------------------
// URL generation
// ---------------------------------------------------------------------------

const BASE_DOMAIN = "prestige.build";

export function generateEnvironmentUrl(
  projectId: string,
  type: EnvironmentType
): string {
  const slug = projectId.slice(0, 8);

  switch (type) {
    case "development":
      return `https://${slug}-dev.${BASE_DOMAIN}`;
    case "preview":
      return `https://${slug}-preview.${BASE_DOMAIN}`;
    case "production":
      return `https://${slug}.${BASE_DOMAIN}`;
  }
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<EnvironmentStatus, EnvironmentStatus[]> = {
  stopped: ["building"],
  building: ["deploying", "failed", "stopped"],
  deploying: ["active", "failed", "stopped"],
  active: ["building", "stopped"],
  failed: ["building", "stopped"],
};

export function canTransition(
  from: EnvironmentStatus,
  to: EnvironmentStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionEnvironment(
  env: Environment,
  newStatus: EnvironmentStatus
): Environment {
  if (!canTransition(env.status, newStatus)) {
    throw new Error(
      `Transition invalide : ${env.status} → ${newStatus}`
    );
  }

  return {
    ...env,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    ...(newStatus === "active"
      ? {
          deployedAt: new Date().toISOString(),
          url: generateEnvironmentUrl(env.projectId, env.type),
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Variable management
// ---------------------------------------------------------------------------

export function setVariable(
  env: Environment,
  key: string,
  value: string
): Environment {
  return {
    ...env,
    variables: { ...env.variables, [key]: value },
    updatedAt: new Date().toISOString(),
  };
}

export function removeVariable(
  env: Environment,
  key: string
): Environment {
  const variables = { ...env.variables };
  delete variables[key];
  return {
    ...env,
    variables,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getEnvironmentLabel(type: EnvironmentType): string {
  const labels: Record<EnvironmentType, string> = {
    development: "Développement",
    preview: "Prévisualisation",
    production: "Production",
  };
  return labels[type];
}
