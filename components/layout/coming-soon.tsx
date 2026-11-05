import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/** Placeholder body for sections scheduled in a later milestone. */
export function ComingSoon({ section, milestone }: { section: string; milestone: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-6" aria-hidden />
        </div>
        <div className="grid gap-1">
          <p className="font-medium">{section} is not available yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This section is scheduled for {milestone}. The navigation and access rules are already
            in place.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
