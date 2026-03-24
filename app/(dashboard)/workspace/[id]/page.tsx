"use client";

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import { useFileTree } from "@/lib/store/fileTree";
import { useEditor } from "@/lib/store/editor";
import { useTabs } from "@/lib/store/tabs";
import { useCollaboration } from "@/hooks/useCollaboration";
import { CollaboratorAvatars } from "@/components/collab/CollaboratorAvatars";
import { RemoteCursors } from "@/components/collab/RemoteCursors";
import { AiPanel } from "@/components/workspace/AIPanel";
import { FileTree } from "@/components/workspace/FileTree";
import { Tabs } from "@/components/workspace/Tabs";
import { AiDiffViewer } from "@/components/workspace/AiDiffViewer";
import AIMultiFilePreview from "@/components/workspace/AIMultiFilePreview";
import AICodePreview from "@/components/workspace/AICodePreview";
import { WorkspaceLogs } from "@/components/workspace/WorkspaceLogs";
import { WorkspaceErrorBoundary } from "@/components/workspace/WorkspaceErrorBoundary";

// Chargement paresseux des composants lourds
const CodeEditor = lazy(() =>
  import("@/components/workspace/Editor").then((m) => ({ default: m.CodeEditor }))
);
const PreviewFrame = lazy(() =>
  import("@/components/workspace/PreviewFrame").then((m) => ({ default: m.PreviewFrame }))
);

function EditorFallback() {
  return (
    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        Chargement de l&apos;éditeur…
      </div>
    </div>
  );
}

function WorkspaceLoadingState() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-white">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-gray-400">Chargement du workspace…</span>
      </div>
    </div>
  );
}

function WorkspaceErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const router = useRouter();
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-white">
      <div className="text-center max-w-md p-8 bg-[#111] border border-white/10 rounded-xl">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/projects")}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Retour aux projets
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm bg-accent hover:bg-accentDark text-white rounded transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type BottomTab = "preview" | "logs";

export default function WorkspacePage() {
  const params = useParams();
  
  // Safely extract projectId from params
  const projectId = useMemo(() => {
    if (!params?.id) {
      console.warn("[Workspace] params.id is undefined (may occur during hydration)");
      return null;
    }
    // Handle array case (catch-all routes)
    const idValue = Array.isArray(params.id) ? params.id[0] : params.id;
    console.log("[Workspace] projectId extracted successfully");
    return idValue || null;
  }, [params?.id]);

  const { user } = useUserRole();
  const localUserId = user?.id ?? "anonymous";
  const localUserName = user?.name ?? user?.email ?? "User";

  const { refreshFiles } = useFileTree();
  const { saveFile } = useEditor();
  const { activeFile } = useTabs();
  const [bottomTab, setBottomTab] = useState<BottomTab>("preview");
  const [initError, setInitError] = useState<string | null>(null);

  // Only enable collaboration if we have a valid projectId
  const { cursors, sendCursor, sendEdit } = useCollaboration({
    projectId: projectId ?? "",
    userId: localUserId,
    userName: localUserName,
    enabled: !!projectId,
  });

  // Expose sendCursor for Monaco onDidChangeCursorPosition
  const handleCursorChange = useCallback(
    (e: { position: { lineNumber: number; column: number } }) => {
      if (projectId) {
        sendCursor(e.position.lineNumber, e.position.column, activeFile ?? undefined);
      }
    },
    [sendCursor, activeFile, projectId]
  );

  // Expose sendEdit for Monaco onDidChangeModelContent
  const handleContentChange = useCallback(
    (e: { changes: readonly { range: unknown; text: string }[] }) => {
      if (projectId && activeFile && e.changes.length > 0) {
        const change = e.changes[0];
        sendEdit(activeFile, { text: change.text });
      }
    },
    [sendEdit, activeFile, projectId]
  );

  // Load files when projectId is available
  useEffect(() => {
    if (!projectId) {
      console.warn("[Workspace] Cannot load files: projectId is null");
      return;
    }
    
    console.log("[Workspace] Loading files for project:", projectId);
    
    refreshFiles(projectId).catch((err) => {
      console.error("[Workspace] Error loading files:", err);
      setInitError("Erreur lors du chargement des fichiers du projet.");
    });
  }, [projectId, refreshFiles]);

  const handleApplyDiffs = useCallback(async () => {
    if (activeFile && projectId) {
      await saveFile(projectId);
    }
  }, [activeFile, projectId, saveFile]);

  const handleRetry = useCallback(() => {
    setInitError(null);
    if (projectId) {
      refreshFiles(projectId);
    }
  }, [projectId, refreshFiles]);

  // Show loading state while params are loading during hydration
  if (!params?.id) {
    console.warn("[Workspace] Waiting for params.id during hydration...");
    return <WorkspaceLoadingState />;
  }

  // Show error if projectId is invalid after params loaded
  if (!projectId) {
    console.error("[Workspace] Invalid projectId extracted from params");
    return (
      <WorkspaceErrorState 
        message="ID de projet invalide. Vérifiez l'URL et réessayez."
      />
    );
  }

  // Show initialization error
  if (initError) {
    return <WorkspaceErrorState message={initError} onRetry={handleRetry} />;
  }

  return (
    <WorkspaceErrorBoundary>
      <div className="h-screen w-full flex bg-[#0d0d0d] text-white overflow-hidden">
        {/* Sidebar - FileTree */}
        <div className="w-64 h-full bg-[#111] border-r border-white/10 overflow-auto flex-shrink-0 slide-in">
          <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
            Explorateur
          </div>
          <FileTree projectId={projectId} />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden fade-in">
          {/* Tabs + Collaboration avatars */}
          <div className="flex items-center border-b border-white/10">
            <div className="flex-1">
              <Tabs />
            </div>
            <div className="px-3 flex-shrink-0">
              <CollaboratorAvatars projectId={projectId} userId={localUserId} userName={localUserName} />
            </div>
          </div>

          {/* Editor + AI Panel */}
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Editor */}
              <div className="flex-1 overflow-hidden relative">
                <Suspense fallback={<EditorFallback />}>
                  <CodeEditor projectId={projectId} onCursorChange={handleCursorChange} onContentChange={handleContentChange} />
                </Suspense>
                <RemoteCursors cursors={cursors} currentFileId={activeFile ?? undefined} />
              </div>

              {/* Bottom panel: Preview / Logs */}
              <div className="h-56 border-t border-white/10 flex flex-col flex-shrink-0">
                <div className="flex border-b border-white/10 bg-[#111]">
                  <button
                    onClick={() => setBottomTab("preview")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      bottomTab === "preview"
                        ? "text-accent border-b-2 border-accent"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Aperçu
                  </button>
                  <button
                    onClick={() => setBottomTab("logs")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      bottomTab === "logs"
                        ? "text-accent border-b-2 border-accent"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Journaux
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {bottomTab === "preview" && (
                    <Suspense fallback={<EditorFallback />}>
                      <PreviewFrame projectId={projectId} />
                    </Suspense>
                  )}
                  {bottomTab === "logs" && <WorkspaceLogs projectId={projectId} />}
                </div>
              </div>
            </div>

            {/* AI Panel */}
            <div className="w-80 border-l border-white/10 flex-shrink-0">
              <AiPanel projectId={projectId} />
            </div>

            {/* Diff Viewer overlay */}
            <AiDiffViewer onApply={handleApplyDiffs} />
          </div>
        </div>

        {/* Multi-file preview modal */}
        <AIMultiFilePreview />

        {/* Code preview modal */}
        <AICodePreview />
      </div>
    </WorkspaceErrorBoundary>
  );
}