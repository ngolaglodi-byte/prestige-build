"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/workspace/Sidebar";
import { Tabs } from "@/components/workspace/Tabs";
import Topbar from "@/components/Topbar";
import Preview from "@/components/workspace/Preview";
import { AiPanel } from "@/components/workspace/AIPanel";
import { CodeEditor } from "@/components/workspace/Editor";
import { useFileTree } from "@/lib/store/fileTree";
import { useTabs } from "@/lib/store/tabs";

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  const { user } = useUser();
  const userId = user?.id ?? "";

  const { tree, refreshFiles } = useFileTree();
  const { openTab } = useTabs();

  useEffect(() => {
    refreshFiles(projectId);
  }, [projectId]);

  const handleNewFile = async () => {
    const name = prompt("File name:");
    if (!name) return;

    await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name, content: "" }),
    });

    await refreshFiles(projectId);
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;

    await refreshFiles(projectId);
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;

    await fetch(`/api/projects/${projectId}/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });

    await refreshFiles(projectId);
  };

  const handleRename = async (path: string) => {
    const newName = prompt("New name:", path);
    if (!newName) return;

    await fetch(`/api/projects/${projectId}/files/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath: path, newPath: newName }),
    });

    await refreshFiles(projectId);
  };

  return (
    <div className="h-screen w-full flex bg-[#0d0d0d] text-white">
      {/* SIDEBAR */}
      <div className="w-64 h-full bg-surface border-r border-border p-0 flex flex-col">
        {tree && (
          <Sidebar
            projectId={projectId}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
          />
        )}
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <Topbar />
        </div>

        {/* TABS */}
        <Tabs />

        {/* EDITOR + PREVIEW */}
        <div className="flex flex-1">
          {/* EDITOR */}
          <div className="flex-1 border-r border-border">
            <CodeEditor projectId={projectId} />
          </div>

          {/* PREVIEW */}
          <div className="flex-1">
            <Preview userId={userId} projectId={projectId} />
          </div>
        </div>

        {/* AI PANEL */}
        <AiPanel projectId={projectId} />
      </div>
    </div>
  );
}

