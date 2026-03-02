/**
 * Parses AI output into structured generated files.
 */

import type { GeneratedFile } from "./template-engine";

/**
 * Extracts a JSON array of files from an AI response string.
 * Handles both raw JSON and markdown-fenced JSON blocks.
 */
export function parseGeneratedFiles(aiOutput: string): GeneratedFile[] {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = aiOutput.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = jsonMatch ? jsonMatch[1].trim() : aiOutput.trim();
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (f: unknown): f is { path: string; content: string } =>
          typeof f === "object" &&
          f !== null &&
          typeof (f as Record<string, unknown>).path === "string" &&
          typeof (f as Record<string, unknown>).content === "string"
      )
      .map((f) => ({ path: f.path, content: f.content }));
  } catch {
    return [];
  }
}

/**
 * Merges new files into existing file set, replacing files with the same path.
 */
export function mergeFiles(
  existing: GeneratedFile[],
  incoming: GeneratedFile[]
): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of existing) map.set(f.path, f);
  for (const f of incoming) map.set(f.path, f);
  return Array.from(map.values());
}
