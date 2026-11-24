import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateTime, formatINR } from "@/lib/format";
import { getSchoolLogs, type ActivityLogRow, type AuditLogRow } from "@/lib/queries/logs";

export const metadata: Metadata = { title: "Activity logs" };

function activityText(row: ActivityLogRow): string {
  const value =
    row.new_value && typeof row.new_value === "object" && !Array.isArray(row.new_value)
      ? (row.new_value as Record<string, unknown>)
      : {};
  switch (row.action) {
    case "payment_added":
      return `Payment of ${formatINR(Number(value.amount ?? 0))} added`;
    case "document_uploaded":
      return `Document “${String(value.file_name ?? "")}” uploaded`;
    case "document_downloaded":
      return `Document “${String(value.file_name ?? "")}” downloaded`;
    case "document_archived":
      return "Document archived";
    case "created":
      return row.entity_type === "training_sessions" ? "Training session added" : "Applicant created";
    case "updated":
      return row.entity_type === "training_sessions" ? "Training session updated" : "Record updated";
    case "deleted":
      return row.entity_type === "training_sessions" ? "Training session deleted" : "Record deleted";
    case "status_changed":
      return "Status changed";
    case "login":
      return "Signed in";
    default:
      return row.action.replaceAll("_", " ");
  }
}

function auditText(row: AuditLogRow): string {
  const label = row.action.replaceAll("_", " ");
  return row.target_name ? `${label} · ${row.target_name}` : label;
}

export default async function ActivityLogsPage() {
  await requireAdmin();
  const { activity, audit } = await getSchoolLogs();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Activity logs"
        description="Work history and security events for this school. Rows stay on the record. They cannot be edited or deleted."
      />
      <section className="grid gap-3" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-sm font-semibold tracking-wide uppercase">
          Activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="divide-y rounded-2xl border border-black/10 bg-[#fffcf7]">
            {activity.map((row) => (
              <li key={row.id} className="grid gap-0.5 px-4 py-3 text-sm">
                <p className="font-medium">
                  {activityText(row)}
                  {row.user_name ? (
                    <span className="font-normal text-muted-foreground"> by {row.user_name}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(row.created_at)}
                  {row.applicant_id && row.applicant_name ? (
                    <>
                      {" · "}
                      <Link href={`/applicants/${row.applicant_id}`} className="underline-offset-4 hover:underline">
                        {row.applicant_name}
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3" aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="text-sm font-semibold tracking-wide uppercase">
          Audit
        </h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events yet.</p>
        ) : (
          <ul className="divide-y rounded-2xl border border-black/10 bg-[#fffcf7]">
            {audit.map((row) => (
              <li key={row.id} className="grid gap-0.5 px-4 py-3 text-sm">
                <p className="font-medium capitalize">
                  {auditText(row)}
                  {row.user_name ? (
                    <span className="font-normal text-muted-foreground"> by {row.user_name}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
