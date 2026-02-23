import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="text-xl font-bold">Prestige Build</div>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accentDark text-white text-sm transition-colors"
            >
              S&apos;inscrire
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              Tableau de bord
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {children}
    </>
  );
}
