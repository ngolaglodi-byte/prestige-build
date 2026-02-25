"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  useNotificationStore,
  type Notification,
} from "@/store/useNotificationStore";

/**
 * Hook qui charge les notifications depuis l'API et écoute les nouvelles
 * notifications en temps réel via Supabase Realtime.
 * Filtre les événements pour ne garder que ceux de l'utilisateur courant.
 */
export function useRealtimeNotifications() {
  const {
    setNotifications,
    addNotification,
    setLoading,
  } = useNotificationStore();

  const channelRef = useRef<ReturnType<
    ReturnType<typeof getSupabaseBrowserClient>["channel"]
  > | null>(null);

  // Garder l'ID utilisateur en ref pour le filtre realtime
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Charger les notifications existantes
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        const items: Notification[] = data.notifications ?? [];
        setNotifications(items);

        // Extraire l'userId du premier résultat pour filtrer le realtime
        if (items.length > 0) {
          userIdRef.current = items[0].userId;
        }
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();

    // 2. Écouter les nouvelles notifications en temps réel
    try {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            // Ne garder que les notifications destinées à l'utilisateur courant
            if (
              userIdRef.current &&
              newNotification.userId === userIdRef.current
            ) {
              addNotification(newNotification);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch {
      // Supabase env vars may not be set; real-time is optional
    }

    return () => {
      if (channelRef.current) {
        try {
          const supabase = getSupabaseBrowserClient();
          supabase.removeChannel(channelRef.current);
        } catch {
          // Cleanup silently
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
