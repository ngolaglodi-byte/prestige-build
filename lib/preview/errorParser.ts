export function parseBuildError(log: string) {
  const lower = log.toLowerCase();

  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("syntax") ||
    lower.includes("referenceerror") ||
    lower.includes("typeerror")
  ) {
    return log;
  }

  return null;
}
