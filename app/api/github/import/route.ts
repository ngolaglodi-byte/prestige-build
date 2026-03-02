import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, repo, branch, githubToken, projectId, pathFilter } = body;

    if (!owner || !repo || !githubToken || !projectId) {
      return NextResponse.json(
        { error: "owner, repo, githubToken et projectId sont requis" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid loading GitHub module at startup
    const { importFromGitHub } = await import("@/lib/github/importer");

    const result = await importFromGitHub({
      owner,
      repo,
      branch,
      githubToken,
      projectId,
      pathFilter,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
