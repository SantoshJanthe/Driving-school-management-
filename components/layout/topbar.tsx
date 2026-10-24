"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { pageTitleFor } from "@/components/layout/nav-items";
import { SchoolLogo } from "@/components/layout/school-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { useCan } from "@/components/providers/permission-provider";

/** Full-width dark bar, in the same role as GitHub’s global header. */
export function GlobalHeader({ schoolName }: { schoolName: string }) {
  const canSearch = useCan("view_applicants");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[#3d444d] bg-[#24292f] px-4 text-white">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label={schoolName}>
        <SchoolLogo className="size-8 rounded-md bg-white text-[#1f883d]" />
        <span className="hidden max-w-48 truncate text-sm font-semibold sm:inline">{schoolName}</span>
      </Link>

      {canSearch ? (
        <Link
          href="/applicants"
          className="mx-auto hidden h-8 w-full max-w-md items-center gap-2 rounded-md border border-[#3d444d] bg-[#0d1117] px-3 text-sm text-[#9198a1] md:flex"
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
            className="flex size-8 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
            aria-label="Search applicants"
          >
            <Search className="size-4" />
          </Link>
        ) : null}
        <UserMenu onDark />
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
    <div className="flex h-12 items-center border-b border-[#d0d7de] bg-white px-4 md:px-6">
      <h1 className="truncate text-sm font-semibold text-[#1f2328]">{title}</h1>
    </div>
  );
}
