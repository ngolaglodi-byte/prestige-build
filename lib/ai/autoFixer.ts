"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function autoFixProject() {
  const workspace = useWorkspaceStore.getState();
  const files = workspace.files;

  const fixes: string[] = [];

  for (const path of Object.keys(files)) {
    let content = files[path].content;
    let original = content;

    /* ---------------------------------------------------------
     * 1. Supprimer console.log
     * --------------------------------------------------------- */
    if (/console\.log\(/.test(content)) {
      content = content.replace(/console\.log\(.*?\);?/g, "");
      fixes.push(`🧹 console.log supprimé dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 2. Corriger import sans "from"
     * --------------------------------------------------------- */
    content = content.replace(/import\s+([A-Za-z0-9_,{}\s]+);/g, (match, p1) => {
      fixes.push(`🔧 Import incomplet corrigé dans ${path}`);
      return `// FIX-ME: import incomplet détecté → préciser la source\n// import ${p1};`;
    });

    /* ---------------------------------------------------------
     * 3. Ajouter export default pour composant React
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
      fixes.push(`📤 Export default ajouté dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 4. Corriger metadata Next.js
     * --------------------------------------------------------- */
    if (/metadata\s*=/.test(content) && !/export\s+const\s+metadata/.test(content)) {
      content =
        `export const metadata = {};\n` +
        content.replace(/metadata\s*=/g, "// FIX-ME: metadata mal déclarée");
      fixes.push(`📦 Metadata Next.js corrigée dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 5. Fermer <div> simple (sécurisé)
     * --------------------------------------------------------- */
    const openDivs = (content.match(/<div[^>]*>/g) || []).length;
    const closeDivs = (content.match(/<\/div>/g) || []).length;

    if (openDivs > closeDivs) {
      content += "\n</div>";
      fixes.push(`🔒 Balise <div> fermée automatiquement dans ${path}`);
    }

    /* ---------------------------------------------------------
     * 6. Mise à jour du fichier si modifié
     * --------------------------------------------------------- */
    if (content !== original) {
      workspace.updateFile(path, content);
    }
  }

  return {
    fixCount: fixes.length,
    fixes,
  };
}
