import fs from "fs";
import path from "path";

const ROOT = process.cwd();

export function getProjectRoot(projectId: string) {
  return path.join(ROOT, "workspace", projectId);
}

export function ensureProjectDir(projectId: string) {
  const dir = getProjectRoot(projectId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/* ---------------------------------------------------------
 * WRITE MULTIPLE FILES
 * --------------------------------------------------------- */
export function writeProjectFiles(
  projectId: string,
  files: { path: string; content: string }[]
) {
  const root = ensureProjectDir(projectId);

  for (const file of files) {
    const filePath = path.join(root, file.path);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, file.content, "utf8");
  }
}

/* ---------------------------------------------------------
 * READ FILE TREE (FLAT)
 * --------------------------------------------------------- */
export function readProjectFileTree(projectId: string) {
  const root = ensureProjectDir(projectId);

  function walk(dir: string, base = ""): { path: string; type: "file" | "dir" }[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result: { path: string; type: "file" | "dir" }[] = [];

    for (const entry of entries) {
      const relPath = path.join(base, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        result.push({ path: relPath, type: "dir" });
        result.push(...walk(fullPath, relPath));
      } else {
        result.push({ path: relPath, type: "file" });
      }
    }

    return result;
  }

  return walk(root);
}

/* ---------------------------------------------------------
 * LIST PROJECT TREE (alias)
 * --------------------------------------------------------- */
export function listProjectTree(projectId: string) {
  return readProjectFileTree(projectId);
}

/* ---------------------------------------------------------
 * BUILD TREE (FLAT → HIERARCHICAL)
 * --------------------------------------------------------- */
export function buildTree(
  flat: { path: string; type: "file" | "dir" }[]
) {
  const root = {
    name: "",
    path: "",
    type: "folder",
    children: []
  };

  const map = new Map();
  map.set("", root);

  for (const item of flat) {
    const parts = item.path.split("/");
    const name = parts.pop()!;
    const parentPath = parts.join("/");
    const parent = map.get(parentPath);

    const node = {
      name,
      path: item.path,
      type: item.type === "dir" ? "folder" : "file",
      children: item.type === "dir" ? [] : undefined
    };

    parent.children.push(node);
    map.set(item.path, node);
  }

  return root;
}

/* ---------------------------------------------------------
 * LIST PROJECT FILES FLAT
 * --------------------------------------------------------- */
export function listProjectFilesFlat(projectId: string) {
  const root = ensureProjectDir(projectId);

  function walk(dir: string, base = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let result: string[] = [];

    for (const entry of entries) {
      const relPath = path.join(base, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        result = result.concat(walk(fullPath, relPath));
      } else {
        result.push(relPath);
      }
    }

    return result;
  }

  return walk(root);
}

/* ---------------------------------------------------------
 * READ SINGLE FILE
 * --------------------------------------------------------- */
export function readProjectFileContent(projectId: string, filePath: string) {
  const root = ensureProjectDir(projectId);
  const fullPath = path.join(root, filePath);

  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

/* ---------------------------------------------------------
 * WRITE SINGLE FILE
 * --------------------------------------------------------- */
export function writeSingleFile(projectId: string, filePath: string, content: string) {
  const root = ensureProjectDir(projectId);
  const fullPath = path.join(root, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, "utf8");
}

/* ---------------------------------------------------------
 * DELETE FILE
 * --------------------------------------------------------- */
export function deleteProjectFile(projectId: string, filePath: string) {
  const root = ensureProjectDir(projectId);
  const fullPath = path.join(root, filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/* ---------------------------------------------------------
 * RENAME / MOVE FILE
 * --------------------------------------------------------- */
export function renameProjectFile(
  projectId: string,
  oldPath: string,
  newPath: string
) {
  const root = ensureProjectDir(projectId);
  const fullOld = path.join(root, oldPath);
  const fullNew = path.join(root, newPath);

  const dir = path.dirname(fullNew);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(fullOld)) {
    fs.renameSync(fullOld, fullNew);
  }
}

/* ---------------------------------------------------------
 * CREATE DIRECTORY
 * --------------------------------------------------------- */
export function createProjectDirectory(projectId: string, dirPath: string) {
  const root = ensureProjectDir(projectId);
  const fullPath = path.join(root, dirPath);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}
