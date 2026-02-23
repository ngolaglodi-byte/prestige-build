"use client";

import { DeviceSelector, DeviceType } from "./DeviceSelector";
import { FrameworkBadge, Framework } from "./FrameworkBadge";

type Status =
  | "building"
  | "running"
  | "error"
  | "restarting"
  | "crashed"
  | "limited"
  | "limit_reached"
  | "stopped_idle";

interface Props {
  status: Status;
  device: DeviceType;
  framework: Framework;
  url: string;
  onDeviceChange: (device: DeviceType) => void;
  onRefresh: () => void;
  onUrlChange: (url: string) => void;
}

const STATUS_CONFIG: Record<
  Status,
  { bg: string; dot: string; text: string; label: string }
> = {
  building: {
    bg: "bg-yellow-900/40 border-yellow-700",
    dot: "border-yellow-400 border-t-transparent animate-spin",
    text: "text-yellow-300",
    label: "Construction…",
  },
  restarting: {
    bg: "bg-yellow-900/40 border-yellow-700",
    dot: "border-yellow-400 border-t-transparent animate-spin",
    text: "text-yellow-300",
    label: "Redémarrage…",
  },
  running: {
    bg: "bg-green-900/40 border-green-700",
    dot: "bg-green-400",
    text: "text-green-300",
    label: "En cours",
  },
  error: {
    bg: "bg-red-900/40 border-red-700",
    dot: "bg-red-400",
    text: "text-red-300",
    label: "Erreur",
  },
  crashed: {
    bg: "bg-red-900/40 border-red-700",
    dot: "bg-red-400",
    text: "text-red-300",
    label: "Planté",
  },
  limited: {
    bg: "bg-orange-900/40 border-orange-700",
    dot: "bg-orange-400",
    text: "text-orange-300",
    label: "Limité",
  },
  limit_reached: {
    bg: "bg-purple-900/40 border-purple-700",
    dot: "bg-purple-400",
    text: "text-purple-300",
    label: "Limite atteinte",
  },
  stopped_idle: {
    bg: "bg-slate-900/40 border-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-300",
    label: "Inactif",
  },
};

export function PreviewToolbar({
  status,
  device,
  framework,
  url,
  onDeviceChange,
  onRefresh,
  onUrlChange,
}: Props) {
  const cfg = STATUS_CONFIG[status];
  const isSpinner = status === "building" || status === "restarting";

  return (
    <div className="flex flex-col border-b border-white/10 bg-[#111]">
      {/* Barre supérieure : statut + framework + rafraîchir */}
      <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${cfg.bg}`}>
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${
            isSpinner ? `border-2 ${cfg.dot}` : cfg.dot
          }`}
        />
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
        <div className="flex-1" />
        <FrameworkBadge framework={framework} />
        <button
          onClick={onRefresh}
          className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
          title="Rafraîchir l'aperçu"
        >
          ↻ Rafraîchir
        </button>
      </div>

      {/* Barre inférieure : sélecteur appareil + barre d'URL */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <DeviceSelector selected={device} onSelect={onDeviceChange} />
        <div className="flex-1 mx-2">
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-accent/50 transition-colors"
            placeholder="URL de l'aperçu"
          />
        </div>
      </div>
    </div>
  );
}
