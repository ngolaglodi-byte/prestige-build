export type FileNode = {
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
  path: string;
};

export class VirtualFileSystem {
  root: FileNode;

  constructor() {
    this.root = {
      name: "root",
      type: "folder",
      children: [],
      path: "root",
    };
  }

  // -----------------------------
  // UPDATE PATHS (IMPORTANT)
  // -----------------------------
  private updatePaths(node: FileNode, basePath: string = "") {
    node.path = basePath ? `${basePath}/${node.name}` : node.name;

    if (node.children) {
      for (const child of node.children) {
        this.updatePaths(child, node.path);
      }
    }
  }

  private refresh() {
    this.updatePaths(this.root);
  }

  // -----------------------------
  // CREATE FOLDER
  // -----------------------------
  createFolder(path: string) {
    const parts = path.split("/");
    let current = this.root;

    for (const part of parts) {
      let child = current.children?.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          type: "folder",
          children: [],
          path: "",
        };
        current.children?.push(child);
      }

      current = child;
    }

    this.refresh();
  }

  // -----------------------------
  // CREATE FILE
  // -----------------------------
  createFile(path: string, content: string = "") {
    const parts = path.split("/");
    const fileName = parts.pop()!;
    let current = this.root;

    for (const part of parts) {
      let child = current.children?.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          type: "folder",
          children: [],
          path: "",
        };
        current.children?.push(child);
      }

      current = child;
    }

    current.children?.push({
      name: fileName,
      type: "file",
      content,
      path: "",
    });

    this.refresh();
  }

  // -----------------------------
  // GET TREE
  // -----------------------------
  getTree() {
    return this.root;
  }
}
