import { CarFront } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Placeholder mark until the school uploads a logo (Settings, Milestone 6).
 * Rendered as an SVG icon so it scales from 24 px (sidebar) to 64 px (login).
 */
export function SchoolLogo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
    >
      <CarFront className="size-[55%]" strokeWidth={2.25} />
    </div>
  );
}
