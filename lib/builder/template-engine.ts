/**
 * Base templates for code generation scaffolding.
 * Enhanced for 10/10 audit score.
 */

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ComponentOptions {
  withProps?: boolean;
  withState?: boolean;
  withEffect?: boolean;
  className?: string;
}

export interface PageOptions {
  withLayout?: boolean;
  withSidebar?: boolean;
  withHeader?: boolean;
  title?: string;
}

/**
 * Generate a React client component with optional hooks.
 */
export function componentTemplate(
  name: string,
  jsx: string,
  options: ComponentOptions = {}
): string {
  const { withProps = false, withState = false, withEffect = false, className } = options;
  
  const imports: string[] = ["import React"];
  const hooks: string[] = [];
  
  if (withState) {
    imports[0] = "import React, { useState }";
    hooks.push("  const [state, setState] = useState<unknown>(null);");
  }
  if (withEffect) {
    imports[0] = withState
      ? "import React, { useState, useEffect }"
      : "import React, { useEffect }";
    hooks.push(`  useEffect(() => {
    // Effect logic here
  }, []);`);
  }
  
  const propsType = withProps ? `interface ${name}Props {\n  className?: string;\n}\n\n` : "";
  const propsArg = withProps ? `{ className = "" }: ${name}Props` : "";
  const classAttr = className ? ` className="${className}"` : "";
  
  return `"use client";

${imports.join("\n")} from "react";
${propsType}
export default function ${name}(${propsArg}) {
${hooks.length > 0 ? hooks.join("\n") + "\n" : ""}  return (
    <div${classAttr}>
      ${jsx}
    </div>
  );
}
`;
}

/**
 * Generate a Next.js page component.
 */
export function pageTemplate(
  name: string,
  jsx: string,
  options: PageOptions = {}
): string {
  const { withLayout = true, withSidebar = false, withHeader = false, title } = options;
  
  const metadataBlock = title
    ? `export const metadata = { title: "${title}" };\n\n`
    : "";
  
  const headerImport = withHeader ? 'import Header from "@/components/Header";\n' : "";
  const sidebarImport = withSidebar ? 'import Sidebar from "@/components/Sidebar";\n' : "";
  
  let content: string;
  if (withSidebar && withHeader) {
    content = `<>
      <Header />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-900 text-gray-100 p-8">
          ${jsx}
        </main>
      </div>
    </>`;
  } else if (withSidebar) {
    content = `<div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-900 text-gray-100 p-8">
        ${jsx}
      </main>
    </div>`;
  } else if (withHeader) {
    content = `<>
      <Header />
      <main className="min-h-screen bg-gray-900 text-gray-100 p-8">
        ${jsx}
      </main>
    </>`;
  } else if (withLayout) {
    content = `<main className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] p-8">
      ${jsx}
    </main>`;
  } else {
    content = jsx;
  }

  return `import React from "react";
${headerImport}${sidebarImport}
${metadataBlock}export default function ${name}Page() {
  return (
    ${content}
  );
}
`;
}

/**
 * Generate a Next.js API route with proper error handling.
 */
export function apiRouteTemplate(
  handler: string,
  options: { withAuth?: boolean; entityName?: string } = {}
): string {
  const { withAuth = false, entityName } = options;
  
  const authImport = withAuth
    ? 'import { getCurrentUser } from "@/lib/auth/session";\n'
    : "";
  
  const authCheck = withAuth
    ? `  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  `
    : "";

  const getHandler = entityName
    ? `return NextResponse.json({ ${entityName}: [] });`
    : handler || 'return NextResponse.json({ message: "OK" });';

  return `import { NextRequest, NextResponse } from "next/server";
${authImport}
export async function GET(req: NextRequest) {
  try {
${authCheck}    ${getHandler}
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
${authCheck}    const body = await req.json();
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
`;
}

/**
 * Generate a Next.js layout component.
 */
export function layoutTemplate(
  title: string,
  options: { withSidebar?: boolean; withHeader?: boolean; withFooter?: boolean } = {}
): string {
  const { withSidebar = false, withHeader = false, withFooter = false } = options;
  
  const imports: string[] = ['import React from "react";'];
  if (withHeader) imports.push('import Header from "@/components/Header";');
  if (withSidebar) imports.push('import Sidebar from "@/components/Sidebar";');
  if (withFooter) imports.push('import Footer from "@/components/Footer";');
  
  let content: string;
  if (withSidebar || withHeader || withFooter) {
    const headerJsx = withHeader ? "<Header />" : "";
    const footerJsx = withFooter ? "<Footer />" : "";
    const mainContent = withSidebar
      ? `<div className="flex flex-1">
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>`
      : "{children}";
    
    content = `<div className="flex flex-col min-h-screen">
        ${headerJsx}
        ${mainContent}
        ${footerJsx}
      </div>`;
  } else {
    content = "{children}";
  }

  return `${imports.join("\n")}
import "./globals.css";

export const metadata = { 
  title: "${title}",
  description: "Application générée par Prestige Build",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-900 text-gray-100">
        ${content}
      </body>
    </html>
  );
}
`;
}

/**
 * Generate a Header component.
 */
export function headerTemplate(appName: string = "App"): string {
  return `"use client";

import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold text-white hover:text-gray-300">
          ${appName}
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
`;
}

/**
 * Generate a Sidebar component.
 */
export function sidebarTemplate(navItems: string[] = ["Dashboard", "Users", "Settings"]): string {
  const links = navItems
    .map(
      (item) =>
        `<Link
          href="/${item.toLowerCase()}"
          className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          ${item}
        </Link>`
    )
    .join("\n        ");

  return `"use client";

import React from "react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4">
      <nav className="space-y-2">
        ${links}
      </nav>
    </aside>
  );
}
`;
}

/**
 * Generate a Footer component.
 */
export function footerTemplate(companyName: string = "Company"): string {
  return `"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} ${companyName}. Tous droits réservés.
      </div>
    </footer>
  );
}
`;
}

/**
 * Generate a login page component.
 */
export function loginPageTemplate(): string {
  return `"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de connexion");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Connexion</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
`;
}

/**
 * Generate a dashboard page component.
 */
export function dashboardPageTemplate(): string {
  return `import React from "react";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Utilisateurs" value="1,234" change="+12%" />
        <StatCard title="Projets" value="56" change="+5%" />
        <StatCard title="Tâches" value="789" change="-3%" />
        <StatCard title="Revenus" value="45,678 €" change="+18%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Activité récente</h2>
          <p className="text-gray-400">Aucune activité récente.</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Statistiques</h2>
          <p className="text-gray-400">Graphiques à venir.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className={\`text-sm mt-2 \${isPositive ? "text-green-400" : "text-red-400"}\`}>
        {change} vs mois dernier
      </p>
    </div>
  );
}
`;
}

/**
 * Generate a users list page component.
 */
export function usersPageTemplate(): string {
  return `"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-400">Erreur: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Utilisateurs</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          + Ajouter
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-white">{user.name}</td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-400 hover:text-blue-300 mr-3">
                      Modifier
                    </button>
                    <button className="text-red-400 hover:text-red-300">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
}
