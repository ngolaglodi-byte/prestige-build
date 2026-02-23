"use client";

import { Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import NotificationCenter from "@/components/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useLanguage } from "@/context/LanguageContext";

export default function Topbar() {
  useRealtimeNotifications();
  const { t } = useLanguage();

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
        {/* Notifications */}
        <NotificationCenter />

        {/* User menu (Clerk UserButton with custom menu items) */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
              userButtonPopoverCard: "bg-surface border border-border",
            },
          }}
        />
      </div>
    </header>
  );
}
