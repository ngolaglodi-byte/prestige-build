"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Send, Sparkles, CheckCircle, Circle } from "lucide-react";
import Logo from "@/components/Logo";
import { STARTER_PROMPTS } from "@/lib/ai/starterPrompts";

type StepStatus = "pending" | "in_progress" | "done";

interface StepState {
  prompt: StepStatus;
  generation: StepStatus;
  preview: StepStatus;
  deployment: StepStatus;
}

const STEP_LABELS: Record<keyof StepState, string> = {
  prompt: "Prompt reçu",
  generation: "Génération IA",
  preview: "Aperçu",
  deployment: "Prêt au déploiement",
};

export default function CreateProjectPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepState>({
    prompt: "pending",
    generation: "pending",
    preview: "pending",
    deployment: "pending",
  });
  const [generatedFiles, setGeneratedFiles] = useState<{ path: string; content: string }[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setGeneratedFiles([]);
    setSteps({ prompt: "pending", generation: "pending", preview: "pending", deployment: "pending" });

    try {
      const res = await fetch("/api/ai/prompt-to-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        setError(data.error ?? `Erreur HTTP ${res.status}`);
        setLoading(false);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) {
            const text = decoder.decode(value);
            const events = text.split("\n\n").filter(Boolean);
            for (const ev of events) {
              const dataLine = ev.split("\n").find((l) => l.startsWith("data: "));
              const eventLine = ev.split("\n").find((l) => l.startsWith("event: "));
              if (!dataLine) continue;
              const data = JSON.parse(dataLine.slice(6));
              const eventType = eventLine?.slice(7) ?? "step";

              if (eventType === "step" && data.step) {
                setSteps((prev) => ({ ...prev, [data.step]: data.status }));
              }
              if (eventType === "result" && data.files) {
                setGeneratedFiles(data.files);
              }
              if (eventType === "error") {
                setError(data.message);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au tableau de bord
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center mt-12 fade-in px-6 pb-16 max-w-3xl mx-auto w-full">
        <Sparkles className="text-accent mb-4" size={36} />
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-center">
          Créer un projet avec l&apos;IA
        </h1>
        <p className="text-gray-400 mb-8 text-center max-w-xl">
          Décrivez votre application en quelques mots et laissez Prestige Build générer la structure
          complète du projet. Aucune connaissance en code requise.
        </p>

        {/* Starter prompts */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {STARTER_PROMPTS.map((s) => (
            <button
              key={s.label}
              onClick={() => { setPrompt(s.prompt); setError(null); setGeneratedFiles([]); }}
              className={`px-3 py-1.5 text-sm rounded-smooth border transition-all ${
                prompt === s.prompt
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-surface text-gray-300 hover:text-white"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Chat-style input */}
        <div className="premium-card p-6 w-full">
          <textarea
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setError(null); }}
            placeholder="Décrivez l'application que vous souhaitez créer…"
            rows={4}
            className="w-full bg-surface border border-border rounded-smooth px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none text-lg"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-smooth font-medium transition-all disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Send size={18} />
                Générer mon app
              </>
            )}
          </button>
        </div>

        {/* Visual steps */}
        {(loading || generatedFiles.length > 0) && (
          <div className="mt-8 w-full premium-card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Progression</h3>
            <div className="flex flex-col gap-3">
              {(Object.keys(STEP_LABELS) as (keyof StepState)[]).map((key) => (
                <div key={key} className="flex items-center gap-3">
                  {steps[key] === "done" ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : steps[key] === "in_progress" ? (
                    <Loader2 size={18} className="text-blue-400 animate-spin" />
                  ) : (
                    <Circle size={18} className="text-gray-600" />
                  )}
                  <span
                    className={`text-sm ${
                      steps[key] === "done"
                        ? "text-green-400"
                        : steps[key] === "in_progress"
                        ? "text-blue-300"
                        : "text-gray-500"
                    }`}
                  >
                    {STEP_LABELS[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated files preview */}
        {generatedFiles.length > 0 && (
          <div className="mt-6 w-full premium-card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {generatedFiles.length} fichiers générés
            </h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {generatedFiles.map((f, i) => (
                <div key={i} className="text-xs font-mono text-gray-400 px-3 py-1.5 bg-gray-800 rounded">
                  {f.path}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-smooth text-red-400 text-sm">
            {error}
          </div>
        )}

        <p className="mt-8 text-gray-500 text-sm">
          Préférez un template ?{" "}
          <Link href="/new" className="text-accent hover:underline">
            Créer un projet classique
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto py-8 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
