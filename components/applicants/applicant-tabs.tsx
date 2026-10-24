"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function ApplicantTabs({
  applicantId,
  showPayments,
}: {
  applicantId: string;
  showPayments: boolean;
}) {
  const pathname = usePathname();
  const base = `/applicants/${applicantId}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/training`, label: "Training" },
    ...(showPayments ? [{ href: `${base}/payments`, label: "Payments" }] : []),
    { href: `${base}/documents`, label: "Documents" },
    { href: `${base}/history`, label: "History" },
  ];

  return (
    <nav aria-label="Applicant sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center border-b-2 px-3 text-sm font-medium",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
