import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { Suspense } from "react";
import ClientLayoutWrapper from "./components/client-wrapper";

export const metadata: Metadata = {
  title: "GenAI Social Studio",
  description: "Multimodal AI-powered social content transformation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <Suspense fallback={null}>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </Suspense>
      </body>
    </html>
  );
}
