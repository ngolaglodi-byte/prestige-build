"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function refactorProject() {
  const workspace = useWorkspaceStore.getState();
  const files = workspace.files;

  const suggestions: string[] = [];

  for (const path of Object.keys(files)) {
    const content = files[path].content;
    const lines = content.split("\n");

    /* ---------------------------------------------------------
     * 1. Imports inutilisés (version améliorée)
     * --------------------------------------------------------- */
    const importMatches = content.match(/import\s+.*?from\s+['"](.*?)['"]/g) || [];
    importMatches.forEach((imp) => {
      const names = imp.match(/{(.*?)}/)?.[1]?.split(",").map((n) => n.trim()) || [];
      names.forEach((name) => {
        if (name && !new RegExp(`\\b${name}\\b`).test(content.replace(imp, ""))) {
          suggestions.push(`🔹 Import potentiellement inutilisé "${name}" dans : ${path}`);
        }
      });
    });

    /* ---------------------------------------------------------
     * 2. Composants trop longs
     * --------------------------------------------------------- */
    if (lines.length > 150) {
      suggestions.push(`🔹 Le fichier ${path} dépasse 150 lignes — envisager de le découper.`);
    }

    /* ---------------------------------------------------------
     * 3. JSX trop imbriqué (version améliorée)
     * --------------------------------------------------------- */
    const divCount = (content.match(/<div/g) || []).length;
    if (divCount > 5) {
      suggestions.push(`🔹 JSX très imbriqué détecté dans ${path} — envisager des sous-composants.`);
    }

    /* ---------------------------------------------------------
     * 4. Fonctions inline dans le JSX
     * --------------------------------------------------------- */
    if (/\(\)\s*=>/.test(content) || /on[A-Za-z]+=\{.*=>/.test(content)) {
      suggestions.push(`🔹 Fonctions inline détectées dans ${path} — déplacer hors du JSX.`);
    }

    /* ---------------------------------------------------------
     * 5. console.log
     * --------------------------------------------------------- */
    if (content.includes("console.log(")) {
      suggestions.push(`🔹 console.log détecté dans ${path} — supprimer pour un code propre.`);
    }

    /* ---------------------------------------------------------
     * 6. Metadata Next.js mal structurée
     * --------------------------------------------------------- */
    if (
      content.includes("metadata") &&
      !/export\s+const\s+metadata\s*=/.test(content)
    ) {
      suggestions.push(`🔹 Metadata Next.js mal déclarée dans ${path}.`);
    }
  }

  return {
    suggestionCount: suggestions.length,
    suggestions,
  };
}
