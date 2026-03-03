"use client";

import { useAIMultiPreviewStore } from "@/lib/store/useAIMultiPreviewStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { DiffEditor } from "@monaco-editor/react";
import { detectLanguage } from "@/lib/utils/detect-language";

export default function AIMultiFilePreview() {
  const previews = useAIMultiPreviewStore((s) => s.previews);
  const clearPreviews = useAIMultiPreviewStore((s) => s.clearPreviews);
  const workspace = useWorkspaceStore();

  if (previews.length === 0) return null;

  const applyAll = () => {
    previews.forEach((p) => {
      workspace.updateFile(p.file, p.newContent);
    });
    clearPreviews();
  };

  const applyOne = (file: string, newContent: string) => {
    workspace.updateFile(file, newContent);
    clearPreviews();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[950px] max-h-[90vh] overflow-auto bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Aperçu multi-fichiers ({previews.length} fichiers)
        </h2>

        {previews.map((p, i) => {
          const oldContent = workspace.files[p.file]?.content || "";
          const language = detectLanguage(p.file);

          return (
            <div key={i} className="mb-8 border border-white/10 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">{p.file}</h3>

              <div className="h-[300px] rounded-lg overflow-hidden border border-white/10">
                <DiffEditor
                  original={oldContent}
                  modified={p.newContent}
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

              <div className="flex justify-end mt-3">
                <button
                  onClick={() => applyOne(p.file, p.newContent)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Appliquer ce fichier
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex justify-between mt-6">
          <button
            onClick={clearPreviews}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Annuler
          </button>

          <button
            onClick={applyAll}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
          >
            Appliquer toutes les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
