import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prestige Build",
  description: "Plateforme de génération de code propulsée par l'IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="fr">
      <body className="antialiased bg-[#0D0D0D] text-white">
        {children}
      </body>
    </html>
  );

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}
