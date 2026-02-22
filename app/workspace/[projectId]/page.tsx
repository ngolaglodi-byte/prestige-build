"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/workspace/Sidebar";
import Tabs from "@/components/workspace/Tabs";
import Topbar from "@/components/Topbar";
import MonacoEditor from "@/components/editor/MonacoEditor";
import Preview from "@/components/workspace/Preview";
import AIPanel from "@/components/workspace/AIPanel";
import Split from "react-split";

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;

  // -----------------------------
  // THEME
  // -----------------------------
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // -----------------------------
  // FILE TREE (BACKEND)
  // -----------------------------
  const [tree, setTree] = useState<any>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(true);

  const loadTree = async () => {
    setIsLoadingTree(true);
    const res = await fetch(`/api/projects/${projectId}/files/tree`);
    const data = await res.json();
    setTree(data.tree);
    setIsLoadingTree(false);
  };

  useEffect(() => {
    loadTree();
  }, [projectId]);

  // -----------------------------
  // FILE CONTENTS (LOCAL CACHE)
  // -----------------------------
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  // Load file content from backend
  const loadFileContent = async (path: string) => {
    const res = await fetch(
      `/api/projects/${projectId}/file?path=${encodeURIComponent(path)}`
    );
    const data = await res.json();
    return data.content || "";
  };

  const openFile = async (path: string) => {
    if (!files[path]) {
      const content = await loadFileContent(path);
      setFiles((prev) => ({ ...prev, [path]: content }));
    }

    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }

    setActiveFile(path);
  };

  const closeFile = (path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f !== path));
    if (activeFile === path) {
      setActiveFile(openFiles[0] || null);
    }
  };

  // -----------------------------
  // ACTIONS CONNECTÉES AU BACKEND
  // -----------------------------
  const handleNewFile = async () => {
    const name = prompt("File name:");
    if (!name) return;

    await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name, content: "" }),
    });

    await loadTree();
  };

  const handleNewFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;

    await fetch(`/api/projects/${projectId}/files/folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name }),
    });

    await loadTree();
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;

    await fetch(`/api/projects/${projectId}/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });

    closeFile(path);
    await loadTree();
  };

  const handleRename = async (path: string) => {
    const newName = prompt("New name:", path);
    if (!newName) return;

    await fetch(`/api/projects/${projectId}/files/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath: path, newPath: newName }),
    });

    // Update open tabs
    setOpenFiles((prev) => prev.map((f) => (f === path ? newName : f)));

    if (activeFile === path) {
      setActiveFile(newName);
    }

    await loadTree();
  };

  // -----------------------------
  // SAVE FILE CONTENT
  // -----------------------------
  const saveFile = async (path: string, content: string) => {
    await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div
      className={`h-screen w-full flex ${
        theme === "dark" ? "bg-bg text-white" : "bg-white text-black"
      }`}
    >
      {/* SIDEBAR */}
      <div className="w-64 h-full bg-surface border-r border-border p-0 flex flex-col">
        {isLoadingTree && (
          <div className="p-4 text-xs text-gray-400">Loading files...</div>
        )}

        {tree && !isLoadingTree && (
          <Sidebar
            tree={tree}
            activeFile={activeFile}
            onSelect={openFile}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onDelete={handleDelete}
            onRename={handleRename}
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
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          onSelect={openFile}
          onClose={closeFile}
        />

        {/* EDITOR + PREVIEW */}
        <Split
          className="flex flex-1"
          sizes={[50, 50]}
          minSize={300}
          gutterSize={8}
          direction="horizontal"
        >
          {/* EDITOR */}
          <div className="h-full border-r border-border">
            {activeFile && (
              <MonacoEditor
                code={files[activeFile] || ""}
                language="javascript"
                onChange={(value) => {
                  setFiles((prev) => ({ ...prev, [activeFile]: value }));
                  saveFile(activeFile, value);
                }}
              />
            )}
          </div>

          {/* PREVIEW */}
          <div className="h-full bg-editor">
            <Preview projectId={projectId} />
          </div>
        </Split>

        {/* AI PANEL */}
        <AIPanel onAICommand={() => {}} />
      </div>
    </div>
  );
}
