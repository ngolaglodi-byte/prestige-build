import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold">Panneau d&apos;administration</h1>
        <p className="text-sm text-gray-400">{user.email}</p>

        <nav className="flex flex-col gap-2 mt-4">
          <Link href="/admin" className="hover:text-blue-400">
            Tableau de bord
          </Link>
          <Link href="/admin/users" className="hover:text-blue-400">
            Utilisateurs
          </Link>
          <Link href="/admin/projects" className="hover:text-blue-400">
            Projets
          </Link>
          <Link href="/admin/ai" className="hover:text-blue-400">
            Intelligence artificielle
          </Link>
          <Link href="/admin/domains" className="hover:text-blue-400">
            Domaines
          </Link>
          <Link href="/admin/logs" className="hover:text-blue-400">
            Journaux d&apos;audit
          </Link>
        </nav>

        <div className="mt-auto">
          <a
            href="/api/auth/logout"
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Déconnexion
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-gray-900 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
