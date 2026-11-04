import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { CursorTrail } from "@/components/layout/cursor-trail";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: env.appName,
    template: `%s · ${env.appName}`,
  },
  description: "Driving school management: applicants, training, payments, documents.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <CursorTrail />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
