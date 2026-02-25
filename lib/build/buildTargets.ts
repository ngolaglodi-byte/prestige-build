// lib/build/buildTargets.ts

export type BuildTarget =
  | "web"
  | "pwa"
  | "android-apk"
  | "android-aab"
  | "ios-ipa"
  | "windows-exe"
  | "windows-msi"
  | "macos-dmg"
  | "macos-app"
  | "linux-appimage"
  | "linux-deb";

export type BuildPlatform =
  | "web"
  | "pwa"
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux";

export type BuildToolchain =
  | "capacitor"
  | "electron"
  | "tauri"
  | "pwa"
  | "web";

export interface BuildTargetConfig {
  target: BuildTarget;
  platform: BuildPlatform;
  label: string;
  icon: string;
  toolchain: BuildToolchain;
  requiresNativeSdk: boolean;
  outputExtension: string;
  description: string;
}

export const BUILD_TARGETS: BuildTargetConfig[] = [
  {
    target: "web",
    platform: "web",
    label: "Web statique",
    icon: "🌐",
    toolchain: "web",
    requiresNativeSdk: false,
    outputExtension: ".zip",
    description: "Build web optimisé (HTML, CSS, JS)",
  },
  {
    target: "pwa",
    platform: "pwa",
    label: "PWA",
    icon: "📲",
    toolchain: "pwa",
    requiresNativeSdk: false,
    outputExtension: ".zip",
    description: "Progressive Web App avec manifest et service worker",
  },
  {
    target: "android-apk",
    platform: "android",
    label: "Android APK",
    icon: "📱",
    toolchain: "capacitor",
    requiresNativeSdk: true,
    outputExtension: ".apk",
    description: "Application Android installable directement (APK)",
  },
  {
    target: "android-aab",
    platform: "android",
    label: "Android AAB",
    icon: "📱",
    toolchain: "capacitor",
    requiresNativeSdk: true,
    outputExtension: ".aab",
    description: "Android App Bundle pour le Play Store",
  },
  {
    target: "ios-ipa",
    platform: "ios",
    label: "iOS IPA",
    icon: "🍎",
    toolchain: "capacitor",
    requiresNativeSdk: true,
    outputExtension: ".ipa",
    description: "Application iOS pour l'App Store ou distribution Ad Hoc",
  },
  {
    target: "windows-exe",
    platform: "windows",
    label: "Windows EXE",
    icon: "🖥️",
    toolchain: "electron",
    requiresNativeSdk: false,
    outputExtension: ".exe",
    description: "Installateur Windows (.exe)",
  },
  {
    target: "windows-msi",
    platform: "windows",
    label: "Windows MSI",
    icon: "🖥️",
    toolchain: "electron",
    requiresNativeSdk: false,
    outputExtension: ".msi",
    description: "Paquet d'installation Windows (.msi)",
  },
  {
    target: "macos-dmg",
    platform: "macos",
    label: "macOS DMG",
    icon: "🍏",
    toolchain: "electron",
    requiresNativeSdk: false,
    outputExtension: ".dmg",
    description: "Image disque macOS (.dmg)",
  },
  {
    target: "macos-app",
    platform: "macos",
    label: "macOS App",
    icon: "🍏",
    toolchain: "tauri",
    requiresNativeSdk: false,
    outputExtension: ".app",
    description: "Application macOS native via Tauri",
  },
  {
    target: "linux-appimage",
    platform: "linux",
    label: "Linux AppImage",
    icon: "🐧",
    toolchain: "electron",
    requiresNativeSdk: false,
    outputExtension: ".AppImage",
    description: "AppImage Linux portable",
  },
  {
    target: "linux-deb",
    platform: "linux",
    label: "Linux DEB",
    icon: "🐧",
    toolchain: "electron",
    requiresNativeSdk: false,
    outputExtension: ".deb",
    description: "Paquet Debian/Ubuntu (.deb)",
  },
];

export function getBuildTargetConfig(
  target: BuildTarget
): BuildTargetConfig | undefined {
  return BUILD_TARGETS.find((t) => t.target === target);
}

export function getTargetsByPlatform(
  platform: BuildPlatform
): BuildTargetConfig[] {
  return BUILD_TARGETS.filter((t) => t.platform === platform);
}

export type BuildStatus =
  | "queued"
  | "building"
  | "success"
  | "failed"
  | "cancelled";

export interface BuildOptions {
  appName?: string;
  appId?: string;
  version?: string;
  themeColor?: string;
  backgroundColor?: string;
  startUrl?: string;
}
