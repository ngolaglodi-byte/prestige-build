export type ComplexityLevel = "small" | "medium" | "large" | "xl";

export function estimateComplexity(prompt: string, code?: string): ComplexityLevel {
  const length = (prompt?.length ?? 0) + (code?.length ?? 0);

  if (length < 500) return "small";        // petite modif, prompt court
  if (length < 5000) return "medium";      // fichier ou feature
  if (length < 20000) return "large";      // plusieurs fichiers
  return "xl";                             // projet complet → 65k tokens
}
