import { FileNode } from "./virtualFs";

export function vfsToSandpack(node: FileNode, basePath = "") {
  let files: Record<string, string> = {};

  const currentPath = basePath ? `${basePath}/${node.name}` : node.name;

  if (node.type === "file") {
    files[`/${currentPath}`] = node.content || "";
  }

  if (node.children) {
    for (const child of node.children) {
      files = { ...files, ...vfsToSandpack(child, currentPath) };
    }
  }

  return files;
}
