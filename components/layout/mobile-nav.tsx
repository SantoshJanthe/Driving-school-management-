"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { isActivePath, MOBILE_PRIMARY_HREFS, visibleNavItems } from "@/components/layout/nav-items";
import { useProfile } from "@/components/providers/permission-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar for < 1024 px: up to four primary sections plus a "More"
 * sheet with the rest, as in the wireframes.
 */
export function MobileNav() {
  const pathname = usePathname();
  const profile = useProfile();
  const [open, setOpen] = useState(false);

  const items = visibleNavItems(profile);
  const primary = MOBILE_PRIMARY_HREFS.map((href) => items.find((i) => i.href === href)).filter(
    (i): i is NonNullable<typeof i> => !!i,
  );
  const more = items.filter((i) => !primary.includes(i));
  const moreActive = more.some((i) => isActivePath(pathname, i.href));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
    >
      <ul className="grid auto-cols-fr grid-flow-col">
        {primary.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        {more.length > 0 ? (
          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    moreActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Menu className="size-5" aria-hidden />
                  More
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
              >
                <SheetHeader className="text-left">
                  <SheetTitle>More</SheetTitle>
                  <SheetDescription className="sr-only">Other sections</SheetDescription>
                </SheetHeader>
                <ul className="grid grid-cols-2 gap-2 px-4">
                  {more.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-14 items-center gap-3 rounded-xl border px-4 text-sm font-medium",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:bg-muted",
                          )}
                        >
                          <item.icon className="size-5" aria-hidden />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
