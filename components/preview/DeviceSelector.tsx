"use client";

export type DeviceType = "desktop" | "iphone" | "android" | "ipad" | "responsive";

interface DeviceConfig {
  key: DeviceType;
  label: string;
  width: number;
  height: number;
  icon: string;
}

export const DEVICES: DeviceConfig[] = [
  { key: "desktop", label: "Bureau", width: 1280, height: 800, icon: "🖥️" },
  { key: "iphone", label: "iPhone", width: 390, height: 844, icon: "📱" },
  { key: "android", label: "Android", width: 412, height: 915, icon: "📱" },
  { key: "ipad", label: "iPad", width: 820, height: 1180, icon: "📋" },
  { key: "responsive", label: "Responsive", width: 0, height: 0, icon: "↔️" },
];

interface Props {
  selected: DeviceType;
  onSelect: (device: DeviceType) => void;
}

export function DeviceSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1">
      {DEVICES.map((device) => (
        <button
          key={device.key}
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
      ))}
    </div>
  );
}
