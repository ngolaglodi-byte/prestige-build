"use client";

import Editor from "@monaco-editor/react";
import { useEditor } from "@/lib/store/editor";
import { useTabs } from "@/lib/store/tabs";
import { useEffect } from "react";

export function CodeEditor({ projectId }: { projectId: string }) {
  const { content, updateContent, saveFile, loadFile } = useEditor();
  const { activeFile } = useTabs();

  // Charger le fichier quand l'onglet actif change
  useEffect(() => {
    if (activeFile) {
      loadFile(projectId, activeFile);
    }
  }, [activeFile]);

  // Auto-save toutes les 1.5 secondes
  useEffect(() => {
    if (!activeFile) return;

    const timeout = setTimeout(() => {
      saveFile(projectId);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [content, activeFile]);

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a file to start editing
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={detectLanguage(activeFile)}
      value={content}
      onChange={(value) => updateContent(value)}
    />
  );
}

function detectLanguage(path: string): string {
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  return "plaintext";
}
