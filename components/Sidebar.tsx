"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  LayoutDashboard,
  Sparkles,
  CreditCard,
  Puzzle,
  Settings,
  LifeBuoy,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { name: "Accueil", href: "/dashboard", icon: Home },
    { name: "Projets", href: "/projects", icon: FolderKanban },
    { name: "Workspace", href: "/workspace", icon: LayoutDashboard },
    { name: "Générations IA", href: "/ai-generations", icon: Sparkles },
    { name: "Facturation", href: "/billing", icon: CreditCard },
    { name: "Intégrations", href: "/integrations", icon: Puzzle },
    { name: "Paramètres", href: "/settings", icon: Settings },
    { name: "Support", href: "/support", icon: LifeBuoy },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        onClick={() => setCollapsed(true)}
      />

      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-surface border border-border rounded-smooth"
        aria-label="Menu"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[#0D0D0D] border-r border-border flex flex-col transition-all duration-300 ${
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-sm text-white shadow-soft">
                PB
              </div>
              <span className="font-semibold text-lg tracking-tight">Prestige Build</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-gray-400 hover:text-white rounded-smooth hover:bg-white/5 transition-colors"
            aria-label={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setCollapsed(true);
                }}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-smooth transition-all duration-200 group ${
                  collapsed ? "justify-center lg:justify-center" : ""
                } ${
                  active
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Prestige Build</p>
          </div>
        )}
      </aside>
    </>
  );
}
