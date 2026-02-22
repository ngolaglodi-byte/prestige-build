export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children: FileNode[] | null;
}

interface FileRecord {
  path: string;
  content: string;
}

export function buildFileTree(files: FileRecord[]): FileNode {
  const root: FileNode = { name: "", path: "", type: "folder", children: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current: FileNode = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;

      let existing = current.children?.find((c) => c.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: isFile ? "file" : "folder",
          children: isFile ? null : [],
        };
        current.children?.push(existing);
      }

      current = existing;
    });
  }

  return root;
}
