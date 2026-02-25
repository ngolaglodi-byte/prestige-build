"use client";

export type DeviceType = "desktop" | "iphone" | "android" | "ipad" | "responsive";

interface DeviceConfig {
  key: DeviceType;
  label: string;
  width: number;
  height: number;
  icon: string;
  buildPlatform?: string;
}

export const DEVICES: DeviceConfig[] = [
  { key: "desktop", label: "Bureau", width: 1280, height: 800, icon: "🖥️" },
  { key: "iphone", label: "iPhone", width: 390, height: 844, icon: "📱", buildPlatform: "ios-ipa" },
  { key: "android", label: "Android", width: 412, height: 915, icon: "📱", buildPlatform: "android-apk" },
  { key: "ipad", label: "iPad", width: 820, height: 1180, icon: "📋" },
  { key: "responsive", label: "Responsive", width: 0, height: 0, icon: "↔️" },
];

interface Props {
  selected: DeviceType;
  onSelect: (device: DeviceType) => void;
  onBuild?: (target: string) => void;
}

export function DeviceSelector({ selected, onSelect, onBuild }: Props) {
  return (
    <div className="flex items-center gap-1">
      {DEVICES.map((device) => (
        <div key={device.key} className="relative group">
          <button
            onClick={() => onSelect(device.key)}
            title={device.label}
            className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
              selected === device.key
                ? "bg-accent text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <span className="mr-1">{device.icon}</span>
            {device.label}
          </button>
          {device.buildPlatform && onBuild && (
            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
              <button
                onClick={() => onBuild(device.buildPlatform!)}
                className="whitespace-nowrap px-2 py-1 text-[10px] rounded bg-neutral-800 border border-white/10 text-amber-300 hover:bg-neutral-700 transition-colors shadow-lg"
              >
                🔨 Build pour cette plateforme
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
