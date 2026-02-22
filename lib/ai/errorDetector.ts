"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function detectErrors() {
  const workspace = useWorkspaceStore.getState();
  const files = workspace.files;

  const errors: string[] = [];

  for (const path of Object.keys(files)) {
    const content = files[path].content;
    const lines = content.split("\n");

    /* ---------------------------------------------------------
     * 1. JSX potentiellement non fermé (version améliorée)
     * --------------------------------------------------------- */
    const openTags = (content.match(/<[^/!][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]+>/g) || []).length;

    if (openTags > closeTags) {
      errors.push(`❌ JSX potentiellement non fermé dans : ${path}`);
    }

    /* ---------------------------------------------------------
     * 2. import sans "from"
     * --------------------------------------------------------- */
    lines.forEach((line, i) => {
      if (
        line.trim().startsWith("import ") &&
        !line.includes("from") &&
        !line.includes('"') &&
        !line.includes("'")
      ) {
        errors.push(`❌ Import incomplet dans ${path} à la ligne ${i + 1}`);
      }
    });

    /* ---------------------------------------------------------
     * 3. Composant React sans export (version améliorée)
     * --------------------------------------------------------- */
    if (
      path.endsWith(".tsx") &&
      /function\s+[A-Z][A-Za-z0-9_]*/.test(content) &&
      !/export\s+default/.test(content)
    ) {
      errors.push(`⚠️ Le fichier ${path} contient un composant React sans export.`);
    }

    /* ---------------------------------------------------------
     * 4. Variables non définies (simple mais utile)
     * --------------------------------------------------------- */
    const undefinedMatches = content.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
    undefinedMatches.forEach((word) => {
      if (word === "undefinedVariable") {
        errors.push(`❌ Variable non définie détectée dans ${path}`);
      }
    });

    /* ---------------------------------------------------------
     * 5. Metadata Next.js mal formée
     * --------------------------------------------------------- */
    if (
      content.includes("metadata") &&
      !/export\s+const\s+metadata\s*=/.test(content)
    ) {
      errors.push(`⚠️ Metadata Next.js mal déclarée dans ${path}`);
    }
  }

  return {
    errorCount: errors.length,
    errors,
  };
}
