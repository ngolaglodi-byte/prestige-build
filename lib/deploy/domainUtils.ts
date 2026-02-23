// lib/deploy/domainUtils.ts

const BASE_DOMAIN = "prestige-build.dev";
const CNAME_TARGET = `cname.${BASE_DOMAIN}`;

export function getDefaultSubdomain(projectId: string) {
  return `${projectId}.${BASE_DOMAIN}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSlugSubdomain(slug: string) {
  return `${slug}.${BASE_DOMAIN}`;
}

export function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase();
}

export function getCnameTarget() {
  return CNAME_TARGET;
}

export function isValidCustomDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  const domainRegex = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
  return domainRegex.test(normalized) && !normalized.endsWith(`.${BASE_DOMAIN}`);
}
