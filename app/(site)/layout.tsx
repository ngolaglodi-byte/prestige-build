import Link from "next/link";
import OnboardingModal from "@/components/OnboardingModal";
import { cookies } from "next/headers";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Check if user is logged in by checking for session cookie
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("prestige_session")?.value;

  return (
    <>
      <OnboardingModal />
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-xl font-bold">Prestige Build</Link>

        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              Se connecter
            </Link>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
              >
                Tableau de bord
              </Link>
              <a
                href="/api/auth/logout"
                className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm transition-colors"
              >
                Déconnexion
              </a>
            </>
          )}
        </div>
      </header>

      {children}
    </>
  );
}
