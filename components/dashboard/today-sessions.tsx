import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodaySession } from "@/lib/queries/dashboard";

const STATUS_VARIANT: Record<
  TodaySession["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "outline",
  completed: "default",
  absent: "destructive",
  cancelled: "secondary",
};

function time(t: string | null) {
  return t ? t.slice(0, 5) : "—";
}

export function TodaySessions({ sessions }: { sessions: TodaySession[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s training sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No sessions scheduled today.
          </p>
        ) : (
          <ul className="divide-y">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {time(s.start_time)}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {s.applicant?.full_name ?? "Unknown applicant"}
                </span>
                {s.vehicle_type ? (
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    {s.vehicle_type}
                  </span>
                ) : null}
                <Badge variant={STATUS_VARIANT[s.status]} className="shrink-0 capitalize">
                  {s.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/training" className="text-sm font-medium underline-offset-4 hover:underline">
          View all
        </Link>
      </CardFooter>
    </Card>
  );
}
