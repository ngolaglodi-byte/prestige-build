import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold">Panneau d&apos;administration</h1>

        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="hover:text-gray-300">
            Tableau de bord
          </Link>
          <Link href="/admin/overview" className="hover:text-gray-300">
            Vue d&apos;ensemble
          </Link>
          <Link href="/admin/users" className="hover:text-gray-300">
            Utilisateurs
          </Link>
          <Link href="/admin/projects" className="hover:text-gray-300">
            Projets
          </Link>
          <Link href="/admin/pricing" className="hover:text-gray-300">
            Tarification
          </Link>
          <Link href="/admin/ai" className="hover:text-gray-300">
            Intelligence artificielle
          </Link>
          <Link href="/admin/domains" className="hover:text-gray-300">
            Domaines
          </Link>
          <Link href="/admin/payments" className="hover:text-gray-300">
            Paiements
          </Link>
          <Link href="/admin/billing" className="hover:text-gray-300">
            Facturation
          </Link>
          <Link href="/admin/logs" className="hover:text-gray-300">
            Journaux
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
