import type { Metadata } from "next";
import "./globals.css";

import AICodePreview from "@/components/workspace/AICodePreview";
import AIMultiFilePreview from "@/components/workspace/AIMultiFilePreview";

export const metadata: Metadata = {
  title: "Prestige Build",
  description: "AI-powered code generation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0D0D0D] text-white">
        {children}

        <AICodePreview />
        <AIMultiFilePreview />
      </body>
    </html>
  );
}
