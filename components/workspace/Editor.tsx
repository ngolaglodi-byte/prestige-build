"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { useEditor } from "@/lib/store/editor";
import { useTabs } from "@/lib/store/tabs";
import { useEffect, useRef, useCallback } from "react";
import type { editor } from "monaco-editor";

export function CodeEditor({ projectId }: { projectId: string }) {
  const { content, updateContent, saveFile, loadFile } = useEditor();
  const { activeFile } = useTabs();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Charger le fichier quand l'onglet actif change
  useEffect(() => {
    if (activeFile) {
      loadFile(projectId, activeFile);
    }
  }, [activeFile, loadFile, projectId]);

  // Auto-save toutes les 1.5 secondes
  useEffect(() => {
    if (!activeFile) return;

    const timeout = setTimeout(() => {
      saveFile(projectId);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [content, activeFile, projectId, saveFile]);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Monaco affiche automatiquement les marqueurs d'erreur via la validation du modèle
    // Les options renderValidationDecorations: "on" ci-dessous activent l'affichage
  }, []);

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Sélectionnez un fichier pour commencer l&apos;édition
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
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: true },
        smoothScrolling: true,
        automaticLayout: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        wordBasedSuggestions: "currentDocument",
        renderValidationDecorations: "on",
      }}
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
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  if (path.endsWith(".sql")) return "sql";
  if (path.endsWith(".sh")) return "shell";
  return "plaintext";
}
