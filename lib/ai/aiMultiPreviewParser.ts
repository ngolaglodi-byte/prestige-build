"use client";

/**
 * Extrait plusieurs previews de fichiers depuis la réponse IA.
 * Format attendu :
 *
 * <preview file="src/app/page.tsx">
 *   ...nouveau contenu...
 * </preview>
 *
 * Retourne :
 * [
 *   { file: "src/app/page.tsx", newContent: "..." },
 *   { file: "src/components/Button.tsx", newContent: "..." }
 * ]
 */
export function parseAIMultiPreview(text: string) {
  if (!text || typeof text !== "string") return [];

  // Regex robuste : supporte espaces, retours à la ligne, indentation
  const regex = /<preview\s+file="([^"]+)"\s*>([\s\S]*?)<\/preview>/gi;

  const previews: { file: string; newContent: string }[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const file = match[1].trim();
    const content = match[2].trim();

    previews.push({
      file,
      newContent: content,
    });
  }

  return previews;
}
