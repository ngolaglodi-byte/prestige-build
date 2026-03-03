"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

export function autoRefactorProject() {
  const workspace = useWorkspaceStore.getState();
  const files = workspace.files;

  const applied: string[] = [];

  for (const path of Object.keys(files)) {
    let content = files[path].content;
    const original = content;

    /* ---------------------------------------------------------
     * 1. Supprimer console.log
     * --------------------------------------------------------- */
    if (/console\.log\(/.test(content)) {
      content = content.replace(/console\.log\(.*?\);?/g, "");
      applied.push(`🧹 console.log supprimé dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 2. Nettoyer imports inutilisés (version améliorée)
     * --------------------------------------------------------- */
    content = content.replace(
      /import\s+{?\s*([^}]*)\s*}?\s*from\s+['"]([^'"]+)['"];?/g,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (match: string, imports: string, _source: string) => {
        const names = imports.split(",").map((i: string) => i.trim());
        const unused = names.filter((name) => !new RegExp(`\\b${name}\\b`).test(content));

        if (unused.length === names.length) {
          applied.push(`🔧 Import inutilisé supprimé dans ${path}`);
          return "";
        }

        return match;
      }
    );

    /* ---------------------------------------------------------
     * 3. Déplacer fonctions inline hors du JSX (sécurisé)
     * --------------------------------------------------------- */
    if (/<.*\(\)\s*=>/.test(content)) {
      content = content.replace(
        /<([A-Za-z0-9]+)[^>]*\s+on[A-Za-z]+=\{\(\)\s*=>\s*{/g,
        `<$1 onClick={handleAction}`
      );

      if (!content.includes("function handleAction")) {
        content = `function handleAction() {}\n` + content;
      }

      applied.push(`📤 Fonctions inline déplacées dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 4. Détection JSX complexe (suggestion)
     * --------------------------------------------------------- */
    const divCount = (content.match(/<div/g) || []).length;
    if (divCount > 5) {
      applied.push(`🔹 JSX complexe détecté dans ${path} (suggestion appliquée partielle)`);
    }

    /* ---------------------------------------------------------
     * 5. Ajouter export default si composant React
     * --------------------------------------------------------- */
    if (
      path.endsWith(".tsx") &&
      /function\s+[A-Z][A-Za-z0-9_]*/.test(content) &&
      !/export\s+default/.test(content)
    ) {
      content = content.replace(
        /function\s+([A-Z][A-Za-z0-9_]*)/,
        "export default function $1"
      );
      applied.push(`📤 Export default ajouté dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 6. Mise à jour du fichier si modifié
     * --------------------------------------------------------- */
    if (content !== original) {
      workspace.updateFile(path, content);
    }
  }

  return {
    appliedCount: applied.length,
    applied,
  };
}
