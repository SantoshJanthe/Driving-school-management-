"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath, visibleNavItems } from "@/components/layout/nav-items";
import { useProfile } from "@/components/providers/permission-provider";
import { cn } from "@/lib/utils";

export function Sidebar({ schoolName }: { schoolName: string }) {
  const pathname = usePathname();
  const profile = useProfile();
  const items = visibleNavItems(profile);

  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col border-r border-[rgba(26,25,22,0.08)] bg-[#fffcf7]/55 px-3 py-6 backdrop-blur-md lg:flex">
      <div className="px-3 pb-4 text-xs tracking-[0.14em] text-[#6b6560] uppercase">
        {schoolName}
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto">
        <ul className="grid gap-1">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                    active
                      ? "bg-[#1a1916] font-medium text-[#f7f4ee]"
                      : "text-[#1a1916] hover:bg-black/5",
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
      <div className="mt-4 border-t border-[rgba(26,25,22,0.08)] px-3 pt-4 text-xs text-[#6b6560]">
        <span className="font-medium text-[#1a1916]">{profile.full_name}</span>
        <br />
        {profile.role === "admin" ? "Administrator" : "Staff"}
      </div>
    </aside>
  );
}
