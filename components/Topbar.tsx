"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import NotificationCenter from "@/components/NotificationCenter";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

export default function Topbar() {
  // Initialise le chargement et l'écoute temps réel des notifications
  useRealtimeNotifications();

  return (
    <div className="h-16 w-full border-b border-border bg-[#111]/80 backdrop-blur-md flex items-center justify-between px-6">

      {/* Recherche */}
      <div className="flex items-center gap-2 bg-surfaceLight border border-border rounded-smooth px-3 py-2 w-80">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher…"
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      {/* Côté droit */}
      <div className="flex items-center gap-6">

        {/* Centre de notifications */}
        <NotificationCenter />

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
          <Image
            src="/avatar.png"
            alt="Avatar"
            width={40}
            height={40}
          />
        </div>
      </div>
    </div>
  );
}
