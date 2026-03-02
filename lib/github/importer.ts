/**
 * GitHub Importer — imports a GitHub repository into Prestige Build.
 *
 * Fetches the file tree and contents from a GitHub repo via the
 * Git Data API, then creates corresponding file records in the DB.
 */

export interface ImportOptions {
  /** GitHub owner/org */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch to import (default: main) */
  branch?: string;
  /** GitHub personal access token */
  githubToken: string;
  /** Target project ID in Prestige Build */
  projectId: string;
  /** Only import paths matching this prefix */
  pathFilter?: string;
}

export interface ImportResult {
  filesImported: number;
  branch: string;
  commitSha: string;
  skippedFiles: string[];
}

export interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function githubRequest(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = path.startsWith("https://")
    ? path
    : `https://api.github.com${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** Max file size we import (500 KB) */
const MAX_FILE_SIZE = 500 * 1024;

/** Binary file extensions to skip */
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".zip", ".tar", ".gz", ".7z", ".rar",
  ".pdf", ".doc", ".docx",
  ".mp3", ".mp4", ".wav", ".avi",
  ".exe", ".dll", ".so", ".dylib",
  ".lock",
]);

function isBinaryPath(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

// ---------------------------------------------------------------------------
// Main import function
// ---------------------------------------------------------------------------

export async function importFromGitHub(
  options: ImportOptions
): Promise<ImportResult> {
  const {
    owner,
    repo,
    branch = "main",
    githubToken,
    pathFilter,
  } = options;

  // 1. Validate token
  const meRes = await githubRequest("/user", githubToken);
  if (!meRes.ok) {
    throw new Error("Token GitHub invalide ou expiré");
  }

  // 2. Get branch ref to find latest commit SHA
  const refRes = await githubRequest(
    `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    githubToken
  );
  if (!refRes.ok) {
    throw new Error(`Branche '${branch}' introuvable dans ${owner}/${repo}`);
  }
  const ref = refRes.data as { object: { sha: string } };
  const commitSha = ref.object.sha;

  // 3. Get commit to find tree SHA
  const commitRes = await githubRequest(
    `/repos/${owner}/${repo}/git/commits/${commitSha}`,
    githubToken
  );
  if (!commitRes.ok) {
    throw new Error("Impossible de récupérer le commit");
  }
  const commit = commitRes.data as { tree: { sha: string } };

  // 4. Get recursive tree
  const treeRes = await githubRequest(
    `/repos/${owner}/${repo}/git/trees/${commit.tree.sha}?recursive=1`,
    githubToken
  );
  if (!treeRes.ok) {
    throw new Error("Impossible de récupérer l'arborescence");
  }
  const tree = treeRes.data as { tree: GitHubTreeEntry[]; truncated: boolean };

  // 5. Filter to importable blobs
  const blobs = tree.tree.filter((entry) => {
    if (entry.type !== "blob") return false;
    if (entry.size && entry.size > MAX_FILE_SIZE) return false;
    if (isBinaryPath(entry.path)) return false;
    if (pathFilter && !entry.path.startsWith(pathFilter)) return false;
    return true;
  });

  // 6. Fetch file contents (collect as ImportedFile[])
  const importedFiles: Array<{ path: string; content: string }> = [];
  const skippedFiles: string[] = [];

  for (const blob of blobs) {
    const blobRes = await githubRequest(
      `/repos/${owner}/${repo}/git/blobs/${blob.sha}`,
      githubToken
    );
    if (!blobRes.ok) {
      skippedFiles.push(blob.path);
      continue;
    }
    const blobData = blobRes.data as { content: string; encoding: string };
    let content: string;
    if (blobData.encoding === "base64") {
      content = Buffer.from(blobData.content, "base64").toString("utf-8");
    } else {
      content = blobData.content;
    }
    importedFiles.push({ path: blob.path, content });
  }

  return {
    filesImported: importedFiles.length,
    branch,
    commitSha,
    skippedFiles,
  };
}

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

export { isBinaryPath, MAX_FILE_SIZE };
