import { Suspense } from "react";
import PreviewPageClient from "./PreviewPageClient";

export const metadata = {
  title: "Aperçu – Prestige Build",
  description: "Moteur de prévisualisation en temps réel",
};

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Chargement du moteur de prévisualisation…
          </div>
        </div>
      }
    >
      <PreviewPageClient />
    </Suspense>
  );
}
