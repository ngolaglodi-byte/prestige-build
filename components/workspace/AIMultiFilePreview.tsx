"use client";

import { useAIMultiPreviewStore } from "@/store/useAIMultiPreviewStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

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
      <div className="w-[900px] max-h-[90vh] overflow-auto bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Aperçu multi-fichiers ({previews.length} fichiers)
        </h2>

        {previews.map((p, i) => {
          const oldContent = workspace.files[p.file]?.content || "";

          return (
            <div key={i} className="mb-8 border border-white/10 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">{p.file}</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Ancien code */}
                <div>
                  <h4 className="text-white/60 mb-2">Ancien code</h4>
                  <pre className="bg-[#1A1A1A] p-3 rounded-lg text-sm text-red-300 overflow-auto h-[250px] whitespace-pre-wrap">
                    {oldContent}
                  </pre>
                </div>

                {/* Nouveau code */}
                <div>
                  <h4 className="text-white/60 mb-2">Nouveau code</h4>
                  <pre className="bg-[#1A1A1A] p-3 rounded-lg text-sm text-green-300 overflow-auto h-[250px] whitespace-pre-wrap">
                    {p.newContent}
                  </pre>
                </div>
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
