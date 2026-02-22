// lib/preview/previewHotReload.ts

import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;
const clientsByKey = new Map<string, Set<WebSocket>>();

export function initHotReloadServer() {
  if (wss) return wss;

  wss = new WebSocketServer({ port: 7071 });

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const key = url.searchParams.get("key") || "unknown";

    if (!clientsByKey.has(key)) {
      clientsByKey.set(key, new Set());
    }
    clientsByKey.get(key)!.add(socket);

    socket.on("close", () => {
      clientsByKey.get(key)?.delete(socket);
    });
  });

  return wss;
}

export function sendHotReloadEvent(key: string, payload: any) {
  const clients = clientsByKey.get(key);
  if (!clients) return;

  const msg = JSON.stringify(payload);

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(msg);
    }
  }
}
