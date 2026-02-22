"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function analyzeDependencies() {
  const workspace = useWorkspaceStore.getState();
  const files = workspace.files;

  const dependencies: Record<string, number> = {};
  const imports: Record<string, string[]> = {};

  for (const path of Object.keys(files)) {
    const content = files[path].content;

    const importLines = content
      .split("\n")
      .filter((line) => line.trim().startsWith("import "));

    imports[path] = importLines;

    for (const line of importLines) {
      // Supporte :
      // import X from "pkg"
      // import { A, B } from "pkg"
      // import * as X from "pkg"
      // import "pkg"
      const match =
        line.match(/from ["'](.+)["']/) ||
        line.match(/import ["'](.+)["']/);

      if (match) {
        const pkg = match[1];

        if (!dependencies[pkg]) dependencies[pkg] = 0;
        dependencies[pkg]++;
      }
    }
  }

  return {
    dependencies,
    imports,
  };
}
