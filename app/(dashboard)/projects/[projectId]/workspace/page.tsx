"use client";

import { useEffect } from "react";
import { useFileTree } from "@/lib/store/fileTree";
import { FileTree } from "@/components/workspace/FileTree";
import { CodeEditor } from "@/components/workspace/Editor";
import { Tabs } from "@/components/workspace/Tabs";
import { AiPanel } from "@/components/workspace/AIPanel";
import AIMultiFilePreview from "@/components/workspace/AIMultiFilePreview"; // IMPORTANT

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  const { refreshFiles } = useFileTree();

  useEffect(() => {
    refreshFiles(params.projectId);
  }, [params.projectId]);

  return (
    <div className="flex h-full relative">
      {/* FileTree */}
      <div className="w-64 border-r border-white/10">
        <FileTree projectId={params.projectId} />
      </div>

      {/* Editor + Tabs + AI Panel */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <Tabs />
          <div className="flex-1">
            <CodeEditor projectId={params.projectId} />
          </div>
        </div>

        {/* AI Panel */}
        <div className="w-80 border-l border-white/10">
          <AiPanel projectId={params.projectId} />
        </div>
      </div>

      {/* Multi‑File Preview (modal) */}
      <AIMultiFilePreview />
    </div>
  );
}
