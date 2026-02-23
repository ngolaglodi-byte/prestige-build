"use client";

import { useSearchParams } from "next/navigation";
import { PreviewEngine } from "@/components/preview/PreviewEngine";

export default function PreviewPageClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const userId = searchParams.get("userId") ?? "";

  if (!projectId || !userId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-gray-400 text-sm">
        <div className="text-center space-y-2">
          <div className="text-2xl">🔍</div>
          <div className="font-medium">Paramètres manquants</div>
          <div className="text-xs text-gray-500">
            Les paramètres <code className="text-accent">projectId</code> et{" "}
            <code className="text-accent">userId</code> sont requis.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PreviewEngine userId={userId} projectId={projectId} />
    </div>
  );
}
