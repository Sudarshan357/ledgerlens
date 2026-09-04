import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/nav/TopNav";
import { SplashIntro } from "@/components/intro/SplashIntro";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LedgerLens — Financial Incident Investigation",
  description: "When money doesn't add up, investigate why.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink-900">
        <SplashIntro />
        <TopNav />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 lg:px-6">{children}</main>
      </body>
    </html>
  );
}
