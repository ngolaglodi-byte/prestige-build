import { NextRequest, NextResponse } from "next/server";
import {
  computeDiff,
  detectConflicts,
  resolveConflicts,
  applyDiff,
  type FileEntry,
  type ConflictResolution,
} from "@/lib/github/sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      localFiles,
      remoteFiles,
      baseFiles,
      resolution,
    }: {
      localFiles: FileEntry[];
      remoteFiles: FileEntry[];
      baseFiles?: FileEntry[];
      resolution?: ConflictResolution;
    } = body;

    if (!localFiles || !remoteFiles) {
      return NextResponse.json(
        { error: "localFiles et remoteFiles sont requis" },
        { status: 400 }
      );
    }

    const diff = computeDiff(localFiles, remoteFiles);
    const conflicts = baseFiles
      ? detectConflicts(localFiles, remoteFiles, baseFiles)
      : [];

    if (conflicts.length > 0 && !resolution) {
      return NextResponse.json({
        status: "conflict",
        diff,
        conflicts,
      });
    }

    const resolved = conflicts.length > 0
      ? resolveConflicts(conflicts, resolution ?? "local")
      : [];

    const mergedFiles = applyDiff(localFiles, diff, resolved);

    return NextResponse.json({
      status: "success",
      diff,
      mergedFiles,
      filesChanged: diff.added.length + diff.modified.length + diff.deleted.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
