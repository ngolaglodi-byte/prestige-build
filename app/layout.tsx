import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prestige Build",
  description: "Plateforme de génération de code propulsée par l'IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-bg text-foreground transition-colors duration-200">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}
