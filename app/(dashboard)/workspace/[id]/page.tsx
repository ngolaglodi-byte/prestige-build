"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFileTree } from "@/lib/store/fileTree";
import { useEditor } from "@/lib/store/editor";
import { useTabs } from "@/lib/store/tabs";
import { AiPanel } from "@/components/workspace/AIPanel";
import { FileTree } from "@/components/workspace/FileTree";
import { Tabs } from "@/components/workspace/Tabs";
import { CodeEditor } from "@/components/workspace/Editor";
import { AiDiffViewer } from "@/components/workspace/AiDiffViewer";
import AIMultiFilePreview from "@/components/workspace/AIMultiFilePreview";
import AICodePreview from "@/components/workspace/AICodePreview";
import { PreviewFrame } from "@/components/workspace/PreviewFrame";
import { WorkspaceLogs } from "@/components/workspace/WorkspaceLogs";

type BottomTab = "preview" | "logs";

export default function WorkspacePage() {
  const params = useParams();
  const id = params.id as string;

  const { refreshFiles } = useFileTree();
  const { saveFile } = useEditor();
  const { activeFile } = useTabs();
  const [bottomTab, setBottomTab] = useState<BottomTab>("preview");

  useEffect(() => {
    refreshFiles(id);
  }, [id]);

  const handleApplyDiffs = async () => {
    if (activeFile) {
      await saveFile(id);
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#0d0d0d] text-white overflow-hidden">
      {/* Sidebar - FileTree */}
      <div className="w-64 h-full bg-[#111] border-r border-white/10 overflow-auto flex-shrink-0">
        <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
          Explorateur
        </div>
        <FileTree projectId={id} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <Tabs />

        {/* Editor + AI Panel */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor projectId={id} />
            </div>

            {/* Bottom panel: Preview / Logs */}
            <div className="h-56 border-t border-white/10 flex flex-col flex-shrink-0">
              <div className="flex border-b border-white/10 bg-[#111]">
                <button
                  onClick={() => setBottomTab("preview")}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    bottomTab === "preview"
                      ? "text-accent border-b-2 border-accent"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Aperçu
                </button>
                <button
                  onClick={() => setBottomTab("logs")}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    bottomTab === "logs"
                      ? "text-accent border-b-2 border-accent"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Journaux
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {bottomTab === "preview" && <PreviewFrame projectId={id} />}
                {bottomTab === "logs" && <WorkspaceLogs projectId={id} />}
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="w-80 border-l border-white/10 flex-shrink-0">
            <AiPanel projectId={id} />
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
  );
}