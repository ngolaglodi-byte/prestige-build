"use client";

import { useAiDiff } from "@/lib/store/aiDiffStore";

export function AiDiffViewer({ onApply }: { onApply: () => void }) {
  const { diffs, visible, hideDiffs } = useAiDiff();

  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111] border border-white/10 rounded-lg w-[80%] h-[80%] flex flex-col">
        <div className="p-3 border-b border-white/10 flex justify-between items-center">
          <div className="text-sm text-gray-300">Modifications suggérées par l&apos;IA</div>
          <button
            onClick={hideDiffs}
            className="text-gray-400 hover:text-white text-xs"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6 text-sm font-mono">
          {diffs.map((d, i) => (
            <div key={i}>
              <div className="text-blue-400 mb-2">{d.path}</div>
              <pre className="bg-black/40 p-3 rounded border border-white/10 whitespace-pre-wrap">
                {d.diff}
              </pre>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={hideDiffs}
            className="px-3 py-1 text-xs rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
          >
            Annuler
          </button>

          <button
            onClick={onApply}
            className="px-3 py-1 text-xs rounded bg-accent text-black"
          >
            Appliquer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
