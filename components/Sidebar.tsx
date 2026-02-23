"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, FolderIcon, Cog6ToothIcon, BellIcon, KeyIcon, UserGroupIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const path = usePathname();

  const items = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Projects", href: "/projects", icon: FolderIcon },
    { name: "Team", href: "/team", icon: UserGroupIcon },
    { name: "Clés API", href: "/api-keys", icon: KeyIcon },
    { name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Usage", href: "/usage", icon: ChartBarIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  return (
    <div className="w-64 h-screen bg-[#0D0D0D] border-r border-border flex flex-col p-4">
      <div className="text-xl font-bold mb-8">Prestige Build</div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const active = path.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-smooth transition-all ${
                active
                  ? "bg-accent/20 text-accent border border-accent"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
