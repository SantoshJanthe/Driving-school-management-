import Link from "next/link";

import { TopographyBackground } from "@/components/marketing/topography-background";
import { SchoolLogo } from "@/components/layout/school-logo";
import { env } from "@/lib/env";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <TopographyBackground />
      <div className="page-enter relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 py-8 md:px-8 md:py-12">
        <header className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <SchoolLogo className="size-10 rounded-xl" />
            <span className="text-sm font-medium tracking-tight">{env.appName}</span>
          </Link>
        </header>
        <main className="rounded-[2rem] border border-black/10 bg-[#fffcf7]/90 p-6 shadow-[0_18px_50px_rgba(26,25,22,0.05)] backdrop-blur-[2px] md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
