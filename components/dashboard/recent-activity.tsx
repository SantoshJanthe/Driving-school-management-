import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatINR } from "@/lib/format";
import type { RecentActivity } from "@/lib/queries/dashboard";

/** Minimal sentence formatter; the full History tab formatter arrives in Milestone 5. */
function describe(entry: RecentActivity): string {
  const value = (entry.new_value ?? {}) as Record<string, unknown>;
  switch (entry.action) {
    case "payment_added":
      return `Payment of ${formatINR(Number(value.amount ?? 0))} added`;
    case "payment_updated":
      return "Payment updated";
    case "payment_deleted":
      return "Payment deleted";
    case "document_uploaded":
      return `Document "${String(value.file_name ?? "")}" uploaded`;
    case "document_downloaded":
      return `Document "${String(value.file_name ?? "")}" downloaded`;
    case "document_archived":
      return "Document archived";
    case "status_changed":
      return "Status changed";
    case "created":
      return entry.entity_type === "training_sessions"
        ? "Training session added"
        : "Applicant created";
    case "updated":
      return entry.entity_type === "training_sessions"
        ? "Training session updated"
        : "Applicant updated";
    case "deleted":
      return entry.entity_type === "training_sessions"
        ? "Training session deleted"
        : "Applicant deleted";
    default:
      return entry.action.replace(/_/g, " ");
  }
}

export function RecentActivityList({ entries }: { entries: RecentActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((e) => (
              <li key={e.id} className="grid gap-0.5 py-2.5 text-sm">
                <p className="font-medium">
                  {describe(e)}
                  {e.user?.full_name ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      by {e.user.full_name}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(e.created_at)}
                  {e.applicant ? (
                    <>
                      {" · "}
                      <Link
                        href={`/applicants/${e.applicant.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {e.applicant.full_name}
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/activity-logs"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          View all
        </Link>
      </CardFooter>
    </Card>
  );
}
