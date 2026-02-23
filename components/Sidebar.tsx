"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, FolderIcon, Cog6ToothIcon, BellIcon, KeyIcon, UserGroupIcon, ChartBarIcon, RectangleStackIcon, PuzzlePieceIcon, SignalIcon } from "@heroicons/react/24/outline";
import Tooltip from "@/components/ui/Tooltip";

export default function Sidebar() {
  const path = usePathname();

  const items = [
    { name: "Tableau de bord", href: "/dashboard", icon: HomeIcon, tip: "Vue d'ensemble de vos projets" },
    { name: "Projets", href: "/projects", icon: FolderIcon, tip: "Gérer vos projets" },
    { name: "Templates", href: "/templates", icon: RectangleStackIcon, tip: "Modèles prêts à l'emploi" },
    { name: "Équipe", href: "/team", icon: UserGroupIcon, tip: "Collaboration d'équipe" },
    { name: "Clés API", href: "/api-keys", icon: KeyIcon, tip: "Gérer vos clés d'accès" },
    { name: "Intégrations", href: "/integrations", icon: PuzzlePieceIcon, tip: "Connecter des services externes" },
    { name: "Webhooks", href: "/webhooks/settings", icon: SignalIcon, tip: "Configurer les webhooks" },
    { name: "Notifications", href: "/notifications", icon: BellIcon, tip: "Alertes et mises à jour" },
    { name: "Utilisation", href: "/usage", icon: ChartBarIcon, tip: "Statistiques d'utilisation" },
    { name: "Paramètres", href: "/settings", icon: Cog6ToothIcon, tip: "Préférences du compte" },
  ];

  return (
    <div className="w-64 h-screen bg-[#0D0D0D] border-r border-border flex flex-col p-4">
      <div className="text-xl font-bold mb-8">Prestige Build</div>

      <nav className="flex flex-col gap-1">
        {items.map((item, index) => {
          const active = path.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Tooltip key={item.name} content={item.tip} position="right">
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-smooth transition-all duration-200 w-full slide-in stagger-${Math.min(index + 1, 5)} ${
                  active
                    ? "bg-accent/20 text-accent border border-accent"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            </Tooltip>
          );
        })}
      </nav>
    </div>
  );
}
