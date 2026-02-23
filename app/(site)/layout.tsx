import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="text-xl font-bold">Prestige Build</div>

        <div className="flex items-center gap-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            >
              Se connecter
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {children}
    </>
  );
}
