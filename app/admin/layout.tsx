import { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold">Admin Panel</h1>

        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="hover:text-gray-300">
            Dashboard
          </Link>
          <Link href="/admin/users" className="hover:text-gray-300">
            Users
          </Link>
          <Link href="/admin/projects" className="hover:text-gray-300">
            Projects
          </Link>
          <Link href="/admin/logs" className="hover:text-gray-300">
            Logs
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
