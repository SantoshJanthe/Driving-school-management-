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
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col border-r border-[#d0d7de] bg-[#f6f8fa] text-[#1f2328] lg:flex">
      <div className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-[#59636e] uppercase">
        {schoolName}
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-3">
        <ul className="grid gap-0.5">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-md px-2 text-sm",
                    active
                      ? "bg-white font-semibold text-[#1f2328] shadow-[inset_0_0_0_1px_#d0d7de]"
                      : "text-[#1f2328] hover:bg-[#eaeef2]",
                  )}
                >
                  <item.icon className="size-4 shrink-0 text-[#59636e]" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-[#d0d7de] px-4 py-3 text-xs text-[#59636e]">
        <span className="font-medium text-[#1f2328]">{profile.full_name}</span>
        <br />
        {profile.role === "admin" ? "Administrator" : "Staff"}
      </div>
    </aside>
  );
}
