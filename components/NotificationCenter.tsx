"use client";

import { useState, useRef, useEffect } from "react";
import { BellIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNotificationStore } from "@/store/useNotificationStore";
import Link from "next/link";

const TYPE_STYLES: Record<string, string> = {
  success: "bg-green-600/20 text-green-400",
  info: "bg-blue-600/20 text-blue-400",
  warning: "bg-yellow-600/20 text-yellow-400",
  error: "bg-red-600/20 text-red-400",
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const count = unreadCount();

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleMarkAsRead(id: string) {
    markAsRead(id);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Réessayer au prochain chargement
    }
  }

  async function handleMarkAllAsRead() {
    markAllAsRead();
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
    } catch {
      // Réessayer au prochain chargement
    }
  }

  async function handleDelete(id: string) {
    removeNotification(id);
    try {
      await fetch("/api/notifications/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Réessayer au prochain chargement
    }
  }

  const recent = notifications.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative premium-hover"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6 text-gray-300" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-xs px-1.5 py-0.5 rounded-full">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-96 max-h-[28rem] bg-surface border border-border rounded-xlSmooth shadow-strong z-50 flex flex-col fade-in">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-accent hover:text-accentLight transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {recent.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                Aucune notification
              </p>
            ) : (
              recent.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 hover:bg-white/5 transition-colors ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">
                          {n.title}
                        </span>
                      </div>
                      {n.message && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-smooth text-xs ${
                            TYPE_STYLES[n.type] ?? TYPE_STYLES.info
                          }`}
                        >
                          {n.type}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(n.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="p-1 text-gray-400 hover:text-accent transition-colors"
                          title="Marquer comme lu"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pied de page */}
          <div className="px-4 py-2 border-t border-border text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-accent hover:text-accentLight transition-colors"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
