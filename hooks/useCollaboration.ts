"use client";

// hooks/useCollaboration.ts
// React hook that connects to the collaboration WebSocket, synchronises
// code edits in real time, and manages remote cursors.

import { useEffect, useRef, useState, useCallback } from "react";

export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  line: number;
  column: number;
  fileId?: string;
}

export interface CollabEdit {
  userId: string;
  fileId: string;
  changes: unknown;
}

interface UseCollaborationOptions {
  projectId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
}

export function useCollaboration({
  projectId,
  userId,
  userName,
  enabled = true,
}: UseCollaborationOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const [collaborators, setCollaborators] = useState<
    { id: string; name: string; color: string; fileId?: string }[]
  >([]);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/api/collab?projectId=${projectId}`
    );

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          userId,
          projectId,
          payload: { name: userName },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "cursor" && msg.userId !== userId) {
          setCursors((prev) => {
            const filtered = prev.filter((c) => c.userId !== msg.userId);
            return [
              ...filtered,
              {
                userId: msg.userId,
                name: msg.payload?.name ?? msg.userId,
                color: msg.payload?.color ?? "#6366F1",
                line: msg.payload?.line ?? 0,
                column: msg.payload?.column ?? 0,
                fileId: msg.fileId,
              },
            ];
          });
        }

        if (msg.type === "join" || msg.type === "leave" || msg.type === "sync") {
          if (Array.isArray(msg.payload?.users)) {
            setCollaborators(msg.payload.users);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 2 seconds
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [enabled, projectId, userId, userName]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendCursor = useCallback(
    (line: number, column: number, fileId?: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "cursor",
            userId,
            projectId,
            fileId,
            payload: { line, column, name: userName },
          })
        );
      }
    },
    [userId, projectId, userName]
  );

  const sendEdit = useCallback(
    (fileId: string, changes: unknown) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "edit",
            userId,
            projectId,
            fileId,
            payload: changes,
          })
        );
      }
    },
    [userId, projectId]
  );

  return { connected, cursors, collaborators, sendCursor, sendEdit };
}
