"use client";

// Lazy import WebContainer to avoid issues in non-browser environments
let webContainerApiModule: typeof import("@webcontainer/api") | null = null;

type FileSystemTree = Record<string, { file: { contents: string } } | { directory: FileSystemTree }>;

let _instance: InstanceType<typeof import("@webcontainer/api").WebContainer> | null = null;
let _bootPromise: Promise<InstanceType<typeof import("@webcontainer/api").WebContainer>> | null = null;

/**
 * Load the WebContainer module dynamically
 */
async function loadWebContainerModule() {
  if (webContainerApiModule) return webContainerApiModule;
  
  try {
    webContainerApiModule = await import("@webcontainer/api");
    return webContainerApiModule;
  } catch (err) {
    console.error("[WebContainer] Failed to load module:", err);
    throw new Error("WebContainer module not available");
  }
}

/**
 * Boot or reuse a singleton WebContainer instance.
 * The WebContainer API only allows one instance per page.
 */
export async function getWebContainer() {
  if (_instance) return _instance;

  if (!_bootPromise) {
    _bootPromise = (async () => {
      const wcModule = await loadWebContainerModule();
      console.log("[WebContainer] Booting WebContainer...");
      const wc = await wcModule.WebContainer.boot();
      _instance = wc;
      console.log("[WebContainer] Boot complete");
      return wc;
    })();
  }

  return _bootPromise;
}

/**
 * Check if the current browser supports WebContainers.
 * WebContainers require SharedArrayBuffer which needs cross-origin isolation.
 */
export function isWebContainerSupported(): boolean {
  if (typeof window === "undefined") {
    console.log("[WebContainer] Not in browser environment");
    return false;
  }
  
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
  console.log("[WebContainer] SharedArrayBuffer available:", hasSharedArrayBuffer);
  
  // Also check for cross-origin isolation (required for SharedArrayBuffer)
  const crossOriginIsolated = typeof window !== "undefined" && window.crossOriginIsolated === true;
  console.log("[WebContainer] Cross-origin isolated:", crossOriginIsolated);
  
  // WebContainer needs SharedArrayBuffer, but cross-origin isolation isn't always required
  // depending on browser security policies
  return hasSharedArrayBuffer;
}

/**
 * Convert a flat file map (path → content) into a WebContainer FileSystemTree.
 */
export function filesToFileSystemTree(
  files: Record<string, { content: string }>
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [filePath, { content }] of Object.entries(files)) {
    const parts = filePath.replace(/^\//, "").split("/");
    let current: FileSystemTree = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Leaf file
        current[part] = { file: { contents: content } };
      } else {
        // Directory
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        const node = current[part];
        if ("directory" in node) {
          current = node.directory;
        }
      }
    }
  }

  return tree;
}

/**
 * Detect the dev command from package.json scripts.
 */
export function detectDevCommand(packageJsonContent: string): string {
  try {
    const pkg = JSON.parse(packageJsonContent);
    const scripts = pkg.scripts ?? {};
    if (scripts.dev) return "npm run dev";
    if (scripts.start) return "npm run start";
    if (scripts.serve) return "npm run serve";
  } catch {
    // ignore parse errors
  }
  return "npm run dev";
}

/**
 * Full lifecycle: mount files, install, start dev server, and return the preview URL.
 * Calls `onLog` for build output and `onServerReady` when the server URL is available.
 */
export async function startWebContainerPreview(options: {
  files: Record<string, { content: string }>;
  onLog?: (message: string, type: "info" | "error" | "warn") => void;
  onServerReady?: (url: string) => void;
  onError?: (message: string) => void;
}): Promise<{ url: string; restart: () => Promise<void> }> {
  const { files, onLog, onServerReady, onError } = options;

  const log = (msg: string, type: "info" | "error" | "warn" = "info") =>
    onLog?.(msg, type);

  // Check support first
  if (!isWebContainerSupported()) {
    const msg = "WebContainer not supported in this environment";
    log(msg, "error");
    onError?.(msg);
    throw new Error(msg);
  }

  const wc = await getWebContainer();

  // Mount files
  log("Montage des fichiers dans le conteneur…");
  const fsTree = filesToFileSystemTree(files);
  await wc.mount(fsTree);

  // Detect dev command from package.json
  const pkgContent = files["package.json"]?.content ?? files["/package.json"]?.content ?? "{}";
  const devCommand = detectDevCommand(pkgContent);

  // Install dependencies
  log("Installation des dépendances (npm install)…");
  const installProcess = await wc.spawn("npm", ["install"]);

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        log(data, "info");
      },
    })
  );

  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    const msg = `npm install a échoué avec le code ${installExitCode}`;
    log(msg, "error");
    onError?.(msg);
    throw new Error(msg);
  }

  // Start dev server
  log(`Démarrage du serveur de développement (${devCommand})…`);
  const [cmd, ...args] = devCommand.split(" ");
  const devProcess = await wc.spawn(cmd, args);

  devProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        log(data, "info");
      },
    })
  );

  // Wait for server-ready event
  const url = await new Promise<string>((resolve) => {
    wc.on("server-ready", (_port: number, serverUrl: string) => {
      log(`Serveur prêt sur ${serverUrl}`);
      onServerReady?.(serverUrl);
      resolve(serverUrl);
    });
  });

  // Restart function
  const restart = async () => {
    log("Redémarrage du serveur de développement…", "warn");
    devProcess.kill();
    const newProcess = await wc.spawn(cmd, args);
    newProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          log(data, "info");
        },
      })
    );
  };

  return { url, restart };
}
