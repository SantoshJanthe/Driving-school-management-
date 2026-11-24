"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABELS,
} from "@/lib/applicants/labels";
import type { StaffOption } from "@/lib/queries/applicants";

const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9";

export function ApplicantFilters({ staff }: { staff: StaffOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const initialQ = params.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = params.get("q") ?? "";
      if (q.trim() === current) return;
      replace("q", q.trim());
    }, 300);
    return () => clearTimeout(handle);
    // replace closes over the latest params; q is the only trigger we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function replace(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `/applicants?${query}` : "/applicants");
    });
  }

  function clear() {
    setQ("");
    setOpen(false);
    startTransition(() => router.replace("/applicants"));
  }

  const active = ["status", "training", "staff"].filter((key) => params.get(key)).length;
  const controls = (
    <div className="grid gap-3 md:flex md:flex-wrap md:items-center">
      <label className="grid gap-1 text-sm md:contents">
        <span className="md:sr-only">Application status</span>
        <select
          aria-label="Application status"
          className={selectClass}
          value={params.get("status") ?? "all"}
          onChange={(event) => replace("status", event.target.value)}
        >
          <option value="all">All statuses</option>
          {APPLICATION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {APPLICATION_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm md:contents">
        <span className="md:sr-only">Training status</span>
        <select
          aria-label="Training status"
          className={selectClass}
          value={params.get("training") ?? "all"}
          onChange={(event) => replace("training", event.target.value)}
        >
          <option value="all">All training</option>
          {TRAINING_STATUSES.map((value) => (
            <option key={value} value={value}>
              {TRAINING_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm md:contents">
        <span className="md:sr-only">Assigned staff</span>
        <select
          aria-label="Assigned staff"
          className={selectClass}
          value={params.get("staff") ?? "all"}
          onChange={(event) => replace("staff", event.target.value)}
        >
          <option value="all">All staff</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}
            </option>
          ))}
        </select>
      </label>
      {active > 0 || q ? (
        <Button type="button" variant="ghost" className="h-11 md:h-9" onClick={clear}>
          Clear
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-3" data-pending={pending ? "" : undefined}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Name, phone or application no."
            aria-label="Search applicants"
            className="h-11 pl-9 text-base md:h-10 md:text-sm"
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="h-11 md:hidden">
              <SlidersHorizontal aria-hidden />
              Filters{active > 0 ? ` (${active})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="text-left">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="sr-only">Filter the applicant list</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-2">{controls}</div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden md:block">{controls}</div>
    </div>
  );
}
