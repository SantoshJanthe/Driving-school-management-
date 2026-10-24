"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { pageTitleFor } from "@/components/layout/nav-items";
import { SchoolLogo } from "@/components/layout/school-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { useCan } from "@/components/providers/permission-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Topbar({ schoolName }: { schoolName: string }) {
  const pathname = usePathname();
  const title = pageTitleFor(pathname);
  const canSearch = useCan("view_applicants");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label={schoolName}>
        <SchoolLogo className="size-8" />
      </Link>
      <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-1">
        {canSearch ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-lg" asChild aria-label="Search applicants">
                <Link href="/applicants">
                  <Search />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search applicants</TooltipContent>
          </Tooltip>
        ) : null}
        <UserMenu />
      </div>
    </header>
  );
}
