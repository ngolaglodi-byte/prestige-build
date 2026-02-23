"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { CheckIcon, TrashIcon } from "@heroicons/react/24/outline";

const TYPE_STYLES: Record<string, string> = {
  success: "bg-green-600/20 text-green-400",
  info: "bg-blue-600/20 text-blue-400",
  warning: "bg-yellow-600/20 text-yellow-400",
  error: "bg-red-600/20 text-red-400",
};

export default function NotificationsPage() {
  useRealtimeNotifications();

  const notifications = useNotificationStore((s) => s.notifications);
  const loading = useNotificationStore((s) => s.loading);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const count = unreadCount();

  async function handleMarkAsRead(id: string) {
    markAsRead(id);
    await fetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async function handleMarkAllAsRead() {
    markAllAsRead();
    await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
  }

  async function handleDelete(id: string) {
    removeNotification(id);
    await fetch("/api/notifications/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Barre supérieure */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au tableau de bord
        </Link>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-gray-400 text-sm mt-1">
              {count > 0
                ? `${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}`
                : "Toutes les notifications sont lues"}
            </p>
          </div>
          {count > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm bg-accent/20 text-accent rounded-smooth hover:bg-accent/30 transition-colors"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement des notifications…</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-400">Aucune notification pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`premium-card p-4 flex justify-between items-start gap-4 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}
                    <span className="font-semibold">{n.title}</span>
                  </div>
                  {n.message && (
                    <p className="text-gray-400 text-sm mt-1">{n.message}</p>
                  )}
                  <span className="text-gray-500 text-sm mt-1">
                    {new Date(n.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-smooth text-sm ${
                      TYPE_STYLES[n.type] ?? TYPE_STYLES.info
                    }`}
                  >
                    {n.type}
                  </span>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 text-gray-400 hover:text-accent transition-colors"
                      title="Marquer comme lu"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
