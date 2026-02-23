import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prestige Build",
  description: "AI-powered code generation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-[#0D0D0D] text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
