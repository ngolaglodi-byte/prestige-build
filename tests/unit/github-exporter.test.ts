import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB and dependencies
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  files: {
    path: "path",
    content: "content",
    projectId: "projectId",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock("@/lib/logger", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { exportToGitHub } from "@/lib/github/exporter";
import { db } from "@/db/client";

function mockFetchSequence(responses: Array<{ ok: boolean; status: number; data: unknown }>) {
  const fn = vi.fn();
  for (const resp of responses) {
    fn.mockResolvedValueOnce({
      ok: resp.ok,
      status: resp.status,
      json: () => Promise.resolve(resp.data),
    });
  }
  return fn;
}

describe("github-exporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws on invalid GitHub token", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([{ ok: false, status: 401, data: { message: "Bad credentials" } }])
    );

    await expect(
      exportToGitHub({
        projectId: "p1",
        repoName: "test-repo",
        githubToken: "bad-token",
      })
    ).rejects.toThrow("Token GitHub invalide");

    vi.unstubAllGlobals();
  });

  it("throws when no project files found", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        // /user
        { ok: true, status: 200, data: { login: "testuser" } },
        // /user/repos (create repo)
        { ok: true, status: 201, data: { full_name: "testuser/test-repo" } },
      ])
    );

    // Mock DB returning empty files
    vi.mocked(db.select().from(undefined!).where).mockResolvedValue([]);

    await expect(
      exportToGitHub({
        projectId: "p1",
        repoName: "test-repo",
        githubToken: "valid-token",
      })
    ).rejects.toThrow("Aucun fichier");

    vi.unstubAllGlobals();
  });

  it("throws when repo creation fails with non-422 status", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        // /user
        { ok: true, status: 200, data: { login: "testuser" } },
        // /user/repos (fail)
        { ok: false, status: 500, data: { message: "Server Error" } },
      ])
    );

    await expect(
      exportToGitHub({
        projectId: "p1",
        repoName: "test-repo",
        githubToken: "valid-token",
      })
    ).rejects.toThrow("Impossible de créer le repo");

    vi.unstubAllGlobals();
  });

  it("succeeds with full export flow (new branch)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        // /user
        { ok: true, status: 200, data: { login: "testuser" } },
        // /user/repos (create)
        { ok: true, status: 201, data: { full_name: "testuser/my-repo" } },
        // blob creation for file1
        { ok: true, status: 201, data: { sha: "blob-sha-1" } },
        // get ref (does not exist for new repo)
        { ok: false, status: 404, data: {} },
        // create tree
        { ok: true, status: 201, data: { sha: "tree-sha" } },
        // create commit
        { ok: true, status: 201, data: { sha: "commit-sha-abc" } },
        // create ref (new branch)
        { ok: true, status: 201, data: {} },
      ])
    );

    vi.mocked(db.select().from(undefined!).where).mockResolvedValue(
      [{ path: "app/page.tsx", content: "export default function Page() {}" }] as never
    );

    const result = await exportToGitHub({
      projectId: "p1",
      repoName: "my-repo",
      githubToken: "valid-token",
    });

    expect(result.repoUrl).toBe("https://github.com/testuser/my-repo");
    expect(result.filesExported).toBe(1);
    expect(result.commitSha).toBe("commit-sha-abc");
    expect(result.branch).toBe("main");

    vi.unstubAllGlobals();
  });

  it("handles existing repo (422 status)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([
        // /user
        { ok: true, status: 200, data: { login: "testuser" } },
        // /user/repos (422 = already exists)
        { ok: false, status: 422, data: { message: "already exists" } },
        // blob
        { ok: true, status: 201, data: { sha: "blob-sha" } },
        // get ref (exists)
        { ok: true, status: 200, data: { object: { sha: "existing-ref-sha" } } },
        // get commit (for base tree)
        { ok: true, status: 200, data: { tree: { sha: "base-tree-sha" } } },
        // create tree
        { ok: true, status: 201, data: { sha: "new-tree-sha" } },
        // create commit
        { ok: true, status: 201, data: { sha: "new-commit-sha" } },
        // update ref (PATCH)
        { ok: true, status: 200, data: {} },
      ])
    );

    vi.mocked(db.select().from(undefined!).where).mockResolvedValue(
      [{ path: "/src/index.ts", content: "console.log('hello')" }] as never
    );

    const result = await exportToGitHub({
      projectId: "p2",
      repoName: "existing-repo",
      githubToken: "valid-token",
    });

    expect(result.repoUrl).toBe("https://github.com/testuser/existing-repo");
    expect(result.commitSha).toBe("new-commit-sha");

    vi.unstubAllGlobals();
  });
});
