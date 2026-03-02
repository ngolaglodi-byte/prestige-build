"use client";

import React, { useState } from "react";
import FigmaConnector from "./components/FigmaConnector";
import FileSelector from "./components/FileSelector";
import ImportPreview from "./components/ImportPreview";
import ImportProgress from "./components/ImportProgress";

interface FigmaPage {
  id: string;
  name: string;
  childCount: number;
}

interface ConvertedComponent {
  name: string;
  code: string;
  path: string;
}

type Step = "connect" | "select" | "preview" | "importing" | "done";

export default function FigmaImportPage() {
  const [step, setStep] = useState<Step>("connect");
  const [token, setToken] = useState("");
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<FigmaPage[]>([]);
  const [tree, setTree] = useState<unknown[]>([]);
  const [components, setComponents] = useState<ConvertedComponent[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const handleConnected = (t: string) => {
    setToken(t);
    setStep("select");
  };

  const handleParsed = (data: { name: string; pages: FigmaPage[]; tree: unknown[] }) => {
    setFileName(data.name);
    setPages(data.pages);
    setTree(data.tree);
    setStep("preview");
  };

  const handleImport = async (selectedPageIds: string[]) => {
    setStep("importing");
    const selectedNodes = (tree as { id: string }[]).filter((n) =>
      selectedPageIds.includes(n.id)
    );
    setImportProgress({ current: 0, total: selectedNodes.length });

    try {
      const res = await fetch("/api/import/figma/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: selectedNodes }),
      });
      const data = await res.json();
      setComponents(data.components ?? []);
      setImportProgress({ current: selectedNodes.length, total: selectedNodes.length });
      setStep("done");
    } catch {
      setStep("preview");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] flex flex-col">
      <header className="px-6 py-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold">🎨 Import Figma</h1>
        <p className="text-sm text-[var(--muted)]">
          Convertissez vos designs Figma en composants React.
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        {step === "connect" && <FigmaConnector onConnected={handleConnected} />}
        {step === "select" && <FileSelector token={token} onParsed={handleParsed} />}
        {step === "preview" && (
          <ImportPreview
            fileName={fileName}
            pages={pages}
            tree={tree}
            onImport={handleImport}
          />
        )}
        {step === "importing" && (
          <ImportProgress
            current={importProgress.current}
            total={importProgress.total}
            label="Conversion des composants…"
          />
        )}
        {step === "done" && (
          <div className="max-w-lg mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-green-400">
              ✅ Import terminé !
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {components.length} composant(s) générés avec succès.
            </p>
            <ul className="space-y-2">
              {components.map((c) => (
                <li
                  key={c.path}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                >
                  <p className="text-sm font-mono text-accent">{c.path}</p>
                  <p className="text-xs text-[var(--muted)]">{c.name}</p>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setStep("connect");
                setComponents([]);
              }}
              className="w-full py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--surface)] transition-colors"
            >
              Importer un autre fichier
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
