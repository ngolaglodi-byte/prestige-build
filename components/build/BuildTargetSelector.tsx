"use client";

import type { BuildTargetConfig, BuildPlatform } from "@/lib/build/buildTargets";
import { BUILD_TARGETS } from "@/lib/build/buildTargets";

interface Props {
  selectedTarget: string | null;
  onSelect: (target: string) => void;
  availableTargets?: string[];
}

const PLATFORM_LABELS: Record<BuildPlatform, string> = {
  web: "Web",
  pwa: "PWA",
  android: "Android",
  ios: "iOS",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

const PLATFORM_ORDER: BuildPlatform[] = [
  "web",
  "pwa",
  "android",
  "ios",
  "windows",
  "macos",
  "linux",
];

function groupByPlatform(
  targets: BuildTargetConfig[]
): Record<string, BuildTargetConfig[]> {
  const groups: Record<string, BuildTargetConfig[]> = {};
  for (const t of targets) {
    if (!groups[t.platform]) groups[t.platform] = [];
    groups[t.platform].push(t);
  }
  return groups;
}

export function BuildTargetSelector({
  selectedTarget,
  onSelect,
  availableTargets,
}: Props) {
  const grouped = groupByPlatform(BUILD_TARGETS);

  return (
    <div className="space-y-3">
      {PLATFORM_ORDER.map((platform) => {
        const targets = grouped[platform];
        if (!targets?.length) return null;

        return (
          <div key={platform}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 px-1">
              {PLATFORM_LABELS[platform]}
            </div>
            <div className="flex flex-wrap gap-2">
              {targets.map((t) => {
                const isAvailable =
                  !availableTargets || availableTargets.includes(t.target);
                const isSelected = selectedTarget === t.target;

                return (
                  <button
                    key={t.target}
                    onClick={() => isAvailable && onSelect(t.target)}
                    disabled={!isAvailable}
                    title={
                      isAvailable
                        ? t.description
                        : `Nécessite ${t.toolchain} dans le projet`
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors border ${
                      isSelected
                        ? "bg-amber-700/40 border-amber-600/60 text-amber-200"
                        : isAvailable
                        ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                        : "bg-white/2 border-white/5 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.requiresNativeSdk && (
                      <span
                        className="text-[9px] text-gray-500"
                        title="Nécessite un SDK natif"
                      >
                        ⚙️
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
