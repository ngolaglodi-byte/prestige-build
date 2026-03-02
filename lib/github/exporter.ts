// lib/github/exporter.ts
// Export a project to GitHub using the GitHub Git Data API.

import { db } from "@/db/client";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

export interface ExportOptions {
  projectId: string;
  repoName: string;
  repoDescription?: string;
  isPrivate?: boolean;
  githubToken: string;
  branch?: string;
  commitMessage?: string;
}

export interface ExportResult {
  repoUrl: string;
  filesExported: number;
  commitSha: string;
  branch: string;
}

async function githubRequest(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = path.startsWith("https://") ? path : `https://api.github.com${path}`;
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

export async function exportToGitHub(options: ExportOptions): Promise<ExportResult> {
  const {
    projectId,
    repoName,
    repoDescription = "",
    isPrivate = false,
    githubToken,
    branch = "main",
    commitMessage = "Export depuis Prestige Build",
  } = options;

  // 1. Get authenticated user
  const meRes = await githubRequest("/user", githubToken);
  if (!meRes.ok) {
    throw new Error("Token GitHub invalide ou expiré");
  }
  const me = meRes.data as { login: string };
  const owner = me.login;

  // 2. Create repo (or use existing)
  let repoFullName: string;
  const createRes = await githubRequest("/user/repos", githubToken, {
    method: "POST",
    body: JSON.stringify({
      name: repoName,
      description: repoDescription,
      private: isPrivate,
      auto_init: false,
    }),
  });

  if (createRes.ok) {
    const repo = createRes.data as { full_name: string };
    repoFullName = repo.full_name;
    logger.info({ repoFullName }, "GitHub repo created");
  } else if (createRes.status === 422) {
    // Repo already exists
    repoFullName = `${owner}/${repoName}`;
    logger.info({ repoFullName }, "GitHub repo already exists, using existing");
  } else {
    const err = createRes.data as { message?: string };
    throw new Error(`Unable to create GitHub repo: ${err.message ?? createRes.status}`);
  }

  // 3. Fetch project files from DB
  const projectFiles = await db
    .select({ path: files.path, content: files.content })
    .from(files)
    .where(eq(files.projectId, projectId));

  if (projectFiles.length === 0) {
    throw new Error("Aucun fichier trouvé pour ce projet");
  }

  logger.info({ projectId, fileCount: projectFiles.length }, "Files fetched from DB");

  // 4. Create blobs for each file
  const blobShas: { path: string; sha: string }[] = [];
  for (const file of projectFiles) {
    const blobRes = await githubRequest(
      `/repos/${repoFullName}/git/blobs`,
      githubToken,
      {
        method: "POST",
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      }
    );
    if (!blobRes.ok) {
      const err = blobRes.data as { message?: string };
      throw new Error(`Error creating blob for ${file.path}: ${err.message ?? blobRes.status}`);
    }
    const blob = blobRes.data as { sha: string };
    blobShas.push({ path: file.path.replace(/^\//, ""), sha: blob.sha });
  }

  // 5. Get or create base tree SHA
  let baseTreeSha: string | undefined;
  const refRes = await githubRequest(
    `/repos/${repoFullName}/git/ref/heads/${branch}`,
    githubToken
  );
  if (refRes.ok) {
    const ref = refRes.data as { object: { sha: string } };
    const commitRes = await githubRequest(
      `/repos/${repoFullName}/git/commits/${ref.object.sha}`,
      githubToken
    );
    if (commitRes.ok) {
      const commit = commitRes.data as { tree: { sha: string } };
      baseTreeSha = commit.tree.sha;
    }
  }

  // 6. Create tree
  const treeRes = await githubRequest(
    `/repos/${repoFullName}/git/trees`,
    githubToken,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: blobShas.map(({ path, sha }) => ({
          path,
          mode: "100644",
          type: "blob",
          sha,
        })),
      }),
    }
  );
  if (!treeRes.ok) {
    const err = treeRes.data as { message?: string };
    throw new Error(`Error creating tree: ${err.message ?? treeRes.status}`);
  }
  const tree = treeRes.data as { sha: string };

  // 7. Create commit
  const parentShas: string[] = [];
  if (refRes.ok) {
    const ref = refRes.data as { object: { sha: string } };
    parentShas.push(ref.object.sha);
  }

  const commitRes = await githubRequest(
    `/repos/${repoFullName}/git/commits`,
    githubToken,
    {
      method: "POST",
      body: JSON.stringify({
        message: commitMessage,
        tree: tree.sha,
        parents: parentShas,
      }),
    }
  );
  if (!commitRes.ok) {
    const err = commitRes.data as { message?: string };
    throw new Error(`Error creating commit: ${err.message ?? commitRes.status}`);
  }
  const newCommit = commitRes.data as { sha: string };

  // 8. Update or create branch ref
  if (refRes.ok) {
    await githubRequest(
      `/repos/${repoFullName}/git/refs/heads/${branch}`,
      githubToken,
      {
        method: "PATCH",
        body: JSON.stringify({ sha: newCommit.sha, force: true }),
      }
    );
  } else {
    await githubRequest(
      `/repos/${repoFullName}/git/refs`,
      githubToken,
      {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommit.sha }),
      }
    );
  }

  logger.info({ repoFullName, commitSha: newCommit.sha }, "GitHub export complete");

  return {
    repoUrl: `https://github.com/${repoFullName}`,
    filesExported: projectFiles.length,
    commitSha: newCommit.sha,
    branch,
  };
}
