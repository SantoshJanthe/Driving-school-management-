"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath, visibleNavItems } from "@/components/layout/nav-items";
import { SchoolLogo } from "@/components/layout/school-logo";
import { useProfile } from "@/components/providers/permission-provider";
import { cn } from "@/lib/utils";

export function Sidebar({ schoolName }: { schoolName: string }) {
  const pathname = usePathname();
  const profile = useProfile();
  const items = visibleNavItems(profile);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-3 border-b px-4"
        aria-label="Go to dashboard"
      >
        <SchoolLogo className="size-9" />
        <span className="truncate text-sm leading-tight font-semibold">{schoolName}</span>
      </Link>

      <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
        <ul className="grid gap-1">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{profile.full_name}</span>
        <br />
        {profile.role === "admin" ? "Administrator" : "Staff"}
      </div>
    </aside>
  );
}
