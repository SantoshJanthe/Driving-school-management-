import Link from "next/link";

import { SessionActions } from "@/components/training/session-actions";
import { SessionDialog } from "@/components/training/session-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ApplicantOption, SessionRow, StaffOption } from "@/lib/queries/training";
import { SESSION_STATUS_LABELS, type SessionStatus } from "@/lib/training/constants";
import { cn } from "@/lib/utils";

const DOT: Record<SessionStatus, string> = {
  scheduled: "bg-sky-500",
  completed: "bg-emerald-600",
  absent: "bg-destructive",
  cancelled: "bg-muted-foreground",
};

function clock(value: string | null) {
  return value ? value.slice(0, 5) : "—";
}

export function SessionList({
  rows,
  returnTo,
  canManage,
  isAdmin,
  staff,
  showApplicant,
  showDate,
}: {
  rows: SessionRow[];
  returnTo: string;
  canManage: boolean;
  isAdmin: boolean;
  staff: StaffOption[];
  showApplicant?: boolean;
  showDate?: boolean;
  applicants?: ApplicantOption[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No sessions yet.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {rows.map((row) => (
        <li key={row.id} className="grid gap-3 p-4 md:grid-cols-[7rem_1fr_auto] md:items-center">
          <div className="font-mono text-sm tabular-nums">
            {showDate ? (
              <div className="font-sans text-xs text-muted-foreground">
                {formatDate(row.session_date)}
              </div>
            ) : null}
            {clock(row.start_time)}–{clock(row.end_time)}
          </div>
          <div className="grid gap-1 text-sm">
            {showApplicant ? (
              <Link
                href={`/applicants/${row.applicant_id}/training`}
                className="font-medium hover:underline"
              >
                {row.applicant_name ?? "Applicant"}
              </Link>
            ) : null}
            <p>
              <span className="font-medium">{row.vehicle_type ?? "Vehicle not set"}</span>
              <span className="text-muted-foreground">
                {" "}
                · {row.instructor_name ?? "No instructor"}
              </span>
            </p>
            {row.remarks ? <p className="text-muted-foreground">{row.remarks}</p> : null}
            <Badge variant="outline" className="h-6 w-fit gap-1.5">
              <span className={cn("size-1.5 rounded-full", DOT[row.status])} aria-hidden />
              {SESSION_STATUS_LABELS[row.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <SessionDialog
                staff={staff}
                returnTo={returnTo}
                session={row}
                lockedApplicantId={row.applicant_id}
              />
            ) : null}
            <SessionActions
              id={row.id}
              status={row.status}
              returnTo={returnTo}
              canManage={canManage}
              isAdmin={isAdmin}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
