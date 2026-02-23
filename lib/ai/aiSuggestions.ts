"use client";

/**
 * Extrait les suggestions IA depuis la réponse.
 * Supporte :
 * 1. Format JSON moderne : { "suggestions": [...] }
 * 2. Ancien format Lovable : <suggestion type="...">...</suggestion>
 */
export function parseAISuggestions(text: string) {
  if (!text || typeof text !== "string") return [];

  // ---------------------------------------------------------
  // 1. FORMAT JSON MODERNE
  // ---------------------------------------------------------
  try {
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions.map((s: { type?: string; content?: string }) => ({
          type: s.type ?? "info",
          content: s.content ?? "",
        }));
      }
    }
  } catch {
    // On ignore et on tente le format <suggestion>
  }

  // ---------------------------------------------------------
  // 2. FORMAT <suggestion type="...">...</suggestion>
  // ---------------------------------------------------------
  const regex = /<suggestion\s+type="([^"]+)"\s*>([\s\S]*?)<\/suggestion>/gi;

  const suggestions: { type: string; content: string }[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    suggestions.push({
      type: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return suggestions;
}
