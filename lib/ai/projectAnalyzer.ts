"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function analyzeProject() {
  const workspace = useWorkspaceStore.getState();
  const files = workspace.files;

  const summary = Object.keys(files).map((path) => {
    const content = files[path].content;

    return {
      path,
      lines: content.split("\n").length,
      size: content.length,
      hasJSX: /<[^>]+>/.test(content),
      hasImports: content.includes("import "),
      hasExports: content.includes("export "),
      isComponent: path.includes("components"),
      isPage: path.includes("app") && path.endsWith("page.tsx"),
      isLayout: path.includes("app") && path.endsWith("layout.tsx"),
    };
  });

  const tech = detectTechnologies(files);

  return {
    fileCount: summary.length,
    summary,
    tech,
  };
}

function detectTechnologies(files: any) {
  const content = Object.values(files)
    .map((f: any) => f.content)
    .join("\n");

  return {
    nextjs:
      content.includes("next/navigation") ||
      content.includes("next/link") ||
      content.includes("metadata") ||
      content.includes("useRouter"),
    react:
      content.includes("useState") ||
      content.includes("useEffect") ||
      content.includes("useCallback") ||
      content.includes("useMemo"),
    tailwind:
      content.includes("className=\"") ||
      content.includes("class=\"") ||
      content.includes("bg-") ||
      content.includes("flex"),
    typescript:
      content.includes(":") ||
      content.includes("interface ") ||
      content.includes("type "),
  };
}
