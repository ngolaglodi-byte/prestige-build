interface FileEntry {
  path: string;
  content?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children: FileNode[] | null;
}

export function buildFileTree(files: FileEntry[]): FileNode {
  const root: FileNode = { name: "", path: "", type: "folder", children: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    parts.forEach((part: string, index: number) => {
      const isFile = index === parts.length - 1;

      const existing = (current.children ?? []).find((c) => c.name === part);

      if (!existing) {
        const node: FileNode = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: isFile ? "file" : "folder",
          children: isFile ? null : [],
        };
        (current.children ?? []).push(node);
        if (!isFile) {
          current = node;
        }
      } else if (!isFile) {
        current = existing;
      }
    });
  }

  return root;
}
