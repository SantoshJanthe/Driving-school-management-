"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { pageTitleFor } from "@/components/layout/nav-items";
import { SchoolLogo } from "@/components/layout/school-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { useCan } from "@/components/providers/permission-provider";

export function GlobalHeader({ schoolName }: { schoolName: string }) {
  const canSearch = useCan("view_applicants");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[rgba(26,25,22,0.08)] bg-[#fffcf7]/80 px-4 backdrop-blur-md md:px-6">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2.5"
        aria-label={schoolName}
      >
        <SchoolLogo className="size-8 rounded-lg" />
        <span className="hidden max-w-56 truncate text-sm font-medium tracking-tight sm:inline">
          {schoolName}
        </span>
      </Link>

      {canSearch ? (
        <Link
          href="/applicants"
          className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-full border border-[rgba(26,25,22,0.1)] bg-white/70 px-4 text-sm text-[#6b6560] md:flex"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Search applicants</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        {canSearch ? (
          <Link
            href="/applicants"
            className="flex size-11 items-center justify-center rounded-full hover:bg-black/5 md:hidden"
            aria-label="Search applicants"
          >
            <Search className="size-4" />
          </Link>
        ) : null}
        <UserMenu />
      </div>
    </header>
  );
}

/** Page name under the global header, the way a GitHub repo names the current view. */
export function PageTitleBar() {
  const pathname = usePathname();
  const title = pageTitleFor(pathname);
  if (!title) return null;

  return (
    <div className="flex h-14 items-end px-4 pb-1 md:px-8">
      <h1 className="truncate text-2xl font-medium tracking-tight text-[#1a1916]">{title}</h1>
    </div>
  );
}
