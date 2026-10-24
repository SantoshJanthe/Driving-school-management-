import {
  APPLICATION_STATUS_LABELS,
  TRAINING_STATUS_LABELS,
  type ApplicationStatus,
  type TrainingStatus,
} from "@/lib/applicants/labels";
import { formatDateTime, formatINR } from "@/lib/format";
import type { ApplicantActivity } from "@/lib/queries/applicants";

function labelStatus(kind: "application" | "training", value: unknown) {
  const text = String(value ?? "");
  if (kind === "application" && text in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[text as ApplicationStatus];
  }
  if (kind === "training" && text in TRAINING_STATUS_LABELS) {
    return TRAINING_STATUS_LABELS[text as TrainingStatus];
  }
  return text || "—";
}

function describe(entry: ApplicantActivity): string {
  const value = entry.new_value ?? {};
  const previous = entry.old_value ?? {};
  const by = entry.user_name ? ` by ${entry.user_name}` : "";
  switch (entry.action) {
    case "created":
      return entry.entity_type === "training_sessions"
        ? `Training session added${by}`
        : `Applicant created${by}`;
    case "updated":
      return `Details updated${by}`;
    case "status_changed": {
      const parts: string[] = [];
      if ("application_status" in value) {
        parts.push(
          `Application status: ${labelStatus("application", previous.application_status)} → ${labelStatus("application", value.application_status)}`,
        );
      }
      if ("training_status" in value) {
        parts.push(
          `Training status: ${labelStatus("training", previous.training_status)} → ${labelStatus("training", value.training_status)}`,
        );
      }
      return `${parts.join(". ") || "Status changed"}${by}`;
    }
    case "payment_added":
      return `Payment of ${formatINR(Number(value.amount ?? 0))} added${by}`;
    case "document_uploaded":
      return `Document “${String(value.file_name ?? "")}” uploaded${by}`;
    case "document_downloaded":
      return `Document “${String(value.file_name ?? "")}” downloaded${by}`;
    case "document_archived":
      return `Document archived${by}`;
    case "deleted":
      return entry.entity_type === "documents"
        ? `Document “${String(value.file_name ?? previous.file_name ?? "")}” deleted${by}`
        : `Record deleted${by}`;
    default:
      return `${entry.action.replace(/_/g, " ")}${by}`;
  }
}

export function ActivityList({ entries }: { entries: ApplicantActivity[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No history yet.</p>;
  }

  return (
    <ol className="grid gap-3">
      {entries.map((entry) => {
        const changes = Object.keys(entry.new_value ?? {});
        return (
          <li key={entry.id} className="border-l-2 py-1 pl-4">
            <p className="text-sm font-medium">{describe(entry)}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
            {changes.length > 0 ? (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Changed fields
                </summary>
                <ul className="mt-1 grid gap-0.5 text-xs">
                  {changes.map((key) => (
                    <li key={key}>
                      <span className="text-muted-foreground">{key}: </span>
                      {JSON.stringify(entry.old_value?.[key] ?? null)} →{" "}
                      {JSON.stringify(entry.new_value?.[key] ?? null)}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
