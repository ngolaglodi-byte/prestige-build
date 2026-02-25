"use client";

import { useState } from "react";
import type { BuildTarget, BuildOptions } from "@/lib/build/buildTargets";

interface Props {
  target: BuildTarget;
  onChange: (options: BuildOptions) => void;
}

export function BuildConfigForm({ target, onChange }: Props) {
  const [appName, setAppName] = useState("");
  const [appId, setAppId] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [themeColor, setThemeColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [startUrl, setStartUrl] = useState("/");

  function update(patch: Partial<BuildOptions>) {
    onChange({
      appName: appName || undefined,
      appId: appId || undefined,
      version: version || undefined,
      themeColor: themeColor || undefined,
      backgroundColor: backgroundColor || undefined,
      startUrl: startUrl || undefined,
      ...patch,
    });
  }

  const isAndroid = target === "android-apk" || target === "android-aab";
  const isIos = target === "ios-ipa";
  const isPwa = target === "pwa";

  return (
    <div className="space-y-3">
      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">
            Nom de l&apos;application
          </label>
          <input
            type="text"
            value={appName}
            onChange={(e) => {
              setAppName(e.target.value);
              update({ appName: e.target.value || undefined });
            }}
            placeholder="Mon Application"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">
            Version
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              update({ version: e.target.value || undefined });
            }}
            placeholder="1.0.0"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Android / iOS: Package/Bundle ID */}
      {(isAndroid || isIos) && (
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">
            {isAndroid ? "Package ID (ex: com.monapp)" : "Bundle ID (ex: com.monapp)"}
          </label>
          <input
            type="text"
            value={appId}
            onChange={(e) => {
              setAppId(e.target.value);
              update({ appId: e.target.value || undefined });
            }}
            placeholder={isAndroid ? "com.example.monapp" : "com.example.monapp"}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
          />
        </div>
      )}

      {/* PWA specific fields */}
      {isPwa && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">
              URL de démarrage
            </label>
            <input
              type="text"
              value={startUrl}
              onChange={(e) => {
                setStartUrl(e.target.value);
                update({ startUrl: e.target.value || undefined });
              }}
              placeholder="/"
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">
                Couleur du thème
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => {
                    setThemeColor(e.target.value);
                    update({ themeColor: e.target.value });
                  }}
                  className="w-8 h-8 bg-white/5 border border-white/10 rounded cursor-pointer"
                />
                <span className="text-xs text-gray-400">{themeColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">
                Couleur de fond
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    update({ backgroundColor: e.target.value });
                  }}
                  className="w-8 h-8 bg-white/5 border border-white/10 rounded cursor-pointer"
                />
                <span className="text-xs text-gray-400">{backgroundColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note for native SDK targets */}
      {(isAndroid || isIos) && (
        <div className="text-[10px] text-amber-400/80 bg-amber-900/10 border border-amber-700/20 rounded p-2">
          ⚠️ Ce build nécessite{" "}
          {isAndroid ? "Android SDK + Gradle" : "Xcode + SDK iOS"} installés
          sur le serveur de build.
        </div>
      )}
    </div>
  );
}
