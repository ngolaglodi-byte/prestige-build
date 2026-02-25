"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DeviceType } from "./DeviceSelector";
import { DEVICES } from "./DeviceSelector";
import type { PreviewError } from "./ErrorOverlay";

interface Props {
  src: string;
  device: DeviceType;
  refreshKey: number;
  onError?: (error: PreviewError) => void;
  onLoad?: () => void;
}

export function SandboxFrame({ src, device, refreshKey, onError, onLoad }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedFor, setLoadedFor] = useState<{ key: number; src: string } | null>(null);
  const loaded = loadedFor?.key === refreshKey && loadedFor?.src === src;

  const deviceConfig = DEVICES.find((d) => d.key === device);
  const isResponsive = device === "responsive";
  const isDesktop = device === "desktop";

  const handleLoad = useCallback(() => {
    setLoadedFor({ key: refreshKey, src });
    onLoad?.();
  }, [onLoad, refreshKey, src]);

  // Écouter les messages d'erreur du iframe sandboxé
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "preview-error" && onError) {
        onError({
          message: event.data.message ?? "Erreur inconnue",
          stack: event.data.stack,
          file: event.data.file,
          line: event.data.line,
          column: event.data.column,
        });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onError]);

  const frameStyle: React.CSSProperties =
    isResponsive || isDesktop
      ? { width: "100%", height: "100%" }
      : {
          width: `${deviceConfig?.width ?? 390}px`,
          height: `${deviceConfig?.height ?? 844}px`,
          maxHeight: "100%",
        };

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-auto bg-neutral-950">
      {/* Indicateur de chargement */}
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Chargement de l&apos;aperçu…
          </div>
        </div>
      )}

      {/* Cadre appareil (non-desktop / non-responsive) */}
      {!isResponsive && !isDesktop && (
        <div className="border border-white/10 rounded-2xl overflow-hidden shadow-medium bg-black">
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={src}
            style={frameStyle}
            className="border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onLoad={handleLoad}
            title="Aperçu du projet"
          />
        </div>
      )}

      {/* Bureau / Responsive : iframe plein écran */}
      {(isResponsive || isDesktop) && (
        <iframe
          ref={iframeRef}
          key={refreshKey}
          src={src}
          style={frameStyle}
          className="border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          onLoad={handleLoad}
          title="Aperçu du projet"
        />
      )}
    </div>
  );
}
