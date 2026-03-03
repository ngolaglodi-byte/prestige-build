"use client";

import { useAIPreviewStore } from "@/lib/store/useAIPreviewStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { DiffEditor } from "@monaco-editor/react";
import { detectLanguage } from "@/lib/utils/detect-language";

export default function AICodePreview() {
  const preview = useAIPreviewStore((s) => s.preview);
  const clearPreview = useAIPreviewStore((s) => s.clearPreview);
  const workspace = useWorkspaceStore();

  if (!preview) return null;

  const oldContent = workspace.files[preview.file]?.content || "";
  const newContent = preview.newContent;
  const language = detectLanguage(preview.file);

  const applyChanges = () => {
    workspace.updateFile(preview.file, newContent);
    clearPreview();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[900px] bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Aperçu du code — {preview.file}
        </h2>

        <div className="h-[400px] rounded-lg overflow-hidden border border-white/10">
          <DiffEditor
            original={oldContent}
            modified={newContent}
            language={language}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={clearPreview}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Annuler
          </button>

          <button
            onClick={applyChanges}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Appliquer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
