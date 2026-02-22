// lib/deploy/domainUtils.ts

const BASE_DOMAIN = "prestige-build.dev";

export function getDefaultSubdomain(projectId: string) {
  return `${projectId}.${BASE_DOMAIN}`;
}

export function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase();
}
