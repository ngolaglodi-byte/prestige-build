"use client";

/**
 * Extrait un seul preview de fichier depuis la réponse IA.
 * Format attendu :
 *
 * <preview file="src/app/page.tsx">
 *   ...nouveau contenu...
 * </preview>
 *
 * Retourne :
 * { file: string, newContent: string }
 */
export function parseAIPreview(text: string) {
  if (!text || typeof text !== "string") return null;

  // Regex robuste : supporte espaces, retours à la ligne, indentation
  const regex = /<preview\s+file="([^"]+)"\s*>([\s\S]*?)<\/preview>/i;

  const match = text.match(regex);
  if (!match) return null;

  const file = match[1].trim();
  const content = match[2].trim();

  return {
    file,
    newContent: content,
  };
}
