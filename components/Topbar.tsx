"use client";

import { Search, ShieldCheck, LogOut, User } from "lucide-react";
import Link from "next/link";
import NotificationCenter from "@/components/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useLanguage } from "@/context/LanguageContext";
import { useUserRole, clearUserCache } from "@/hooks/useUserRole";
import { useState } from "react";

export default function Topbar() {
  useRealtimeNotifications();
  const { t } = useLanguage();
  const { user, isAdmin } = useUserRole();
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUserCache();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-border bg-bg/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8">
      {/* Spacer for mobile hamburger */}
      <div className="w-10 lg:hidden" />

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-smooth px-3 py-2 w-72 lg:w-80 focus-within:border-accent/50 transition-colors">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={t("topbar.search")}
          className="bg-transparent outline-none text-sm w-full text-foreground placeholder:text-muted"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Admin Dashboard link — only visible to admins */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>
        )}

        {/* Notifications */}
        <NotificationCenter />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface/80 transition-colors"
          >
            <User className="w-5 h-5 text-accent" />
            <span className="hidden sm:inline text-sm text-foreground">
              {user?.name || user?.email?.split("@")[0] || "User"}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name || "—"}
                  </p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                  <p className="text-xs text-accent mt-1">{user?.role}</p>
                </div>
                <div className="p-2">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface/50 rounded-lg"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Paramètres
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
