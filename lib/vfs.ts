export type VFS = {
  [path: string]: {
    name: string;
    type: "file" | "folder";
    content?: string;
    language?: string;
    children?: string[];
  };
};

// -----------------------------
// UPDATE FILE
// -----------------------------
export function updateFile(vfs: VFS, path: string, content: string): VFS {
  return {
    ...vfs,
    [path]: {
      ...vfs[path],
      content,
    },
  };
}

// -----------------------------
// CREATE FILE
// -----------------------------
export function createFile(vfs: VFS, name: string, content = ""): VFS {
  return {
    ...vfs,
    [name]: {
      name,
      type: "file",
      content,
      language: detectLanguage(name),
    },
  };
}

// -----------------------------
// CREATE FOLDER
// -----------------------------
export function createFolder(vfs: VFS, name: string): VFS {
  return {
    ...vfs,
    [name]: {
      name,
      type: "folder",
      children: [],
    },
  };
}

// -----------------------------
// DELETE FILE OR FOLDER
// -----------------------------
export function deleteNode(vfs: VFS, path: string): VFS {
  const newVfs = { ...vfs };
  delete newVfs[path];
  return newVfs;
}

// -----------------------------
// RENAME FILE OR FOLDER
// -----------------------------
export function renameNode(vfs: VFS, oldPath: string, newPath: string): VFS {
  const newVfs = { ...vfs };

  newVfs[newPath] = {
    ...newVfs[oldPath],
    name: newPath.split("/").pop()!, // ✔️ garde juste le nom
  };

  delete newVfs[oldPath];
  return newVfs;
}

// -----------------------------
// LANGUAGE DETECTION
// -----------------------------
function detectLanguage(name: string): string {
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "javascript";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "typescript";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".html")) return "html";
  return "plaintext";
}
