"use client";

import { useAIPreviewStore } from "@/store/useAIPreviewStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export default function AICodePreview() {
  const preview = useAIPreviewStore((s) => s.preview);
  const clearPreview = useAIPreviewStore((s) => s.clearPreview);
  const workspace = useWorkspaceStore();

  if (!preview) return null;

  const oldContent = workspace.files[preview.file]?.content || "";
  const newContent = preview.newContent;

  const applyChanges = () => {
    workspace.updateFile(preview.file, newContent);
    clearPreview();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[800px] bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Code Preview — {preview.file}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-white/60 mb-2">Ancien code</h3>
            <pre className="bg-[#1A1A1A] p-3 rounded-lg text-sm text-red-300 overflow-auto h-[300px]">
              {oldContent}
            </pre>
          </div>

          <div>
            <h3 className="text-white/60 mb-2">Nouveau code</h3>
            <pre className="bg-[#1A1A1A] p-3 rounded-lg text-sm text-green-300 overflow-auto h-[300px]">
              {newContent}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={clearPreview}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={applyChanges}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
