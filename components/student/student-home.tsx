import { PageHeader } from "@/components/layout/page-header";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/constants";
import { formatDate, formatINR } from "@/lib/format";
import type { StudentHome } from "@/lib/queries/student-home";
import { ATTENDANCE_LABELS, SESSION_STATUS_LABELS } from "@/lib/training/constants";

function clock(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export function StudentHomeView({ home }: { home: StudentHome | null }) {
  if (!home) {
    return (
      <PageHeader
        title="Your training"
        description="This login is not connected to a learner record yet. Ask the school office."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader title={home.full_name} description={home.application_status} />

      <section
        className="grid gap-3 rounded-2xl border border-black/10 bg-[#fffcf7] p-5"
        aria-labelledby="course-heading"
      >
        <h2 id="course-heading" className="text-sm font-semibold tracking-wide uppercase">
          Course
        </h2>
        <p className="text-2xl font-medium">{home.license_category ?? "Course not set"}</p>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Total fee</dt>
            <dd className="text-lg">{formatINR(home.total_fee)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Paid</dt>
            <dd className="text-lg">{formatINR(home.amount_paid)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Balance</dt>
            <dd className="text-lg">{formatINR(home.balance_due)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-3" aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className="text-sm font-semibold tracking-wide uppercase">
          Sessions
        </h2>
        {home.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          <ul className="grid gap-2">
            {home.sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-xl border border-black/10 bg-white/60 px-4 py-3"
              >
                <p className="font-medium">
                  {formatDate(session.session_date)}
                  {session.start_time ? ` · ${clock(session.start_time)}` : ""}
                  {session.end_time ? `–${clock(session.end_time)}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {SESSION_STATUS_LABELS[session.status]}
                  {session.attendance ? ` · ${ATTENDANCE_LABELS[session.attendance]}` : " · Attendance not marked"}
                  {session.vehicle_type ? ` · ${session.vehicle_type}` : ""}
                  {session.instructor_name ? ` · ${session.instructor_name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3" aria-labelledby="documents-heading">
        <h2 id="documents-heading" className="text-sm font-semibold tracking-wide uppercase">
          Documents
        </h2>
        {home.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="grid gap-2">
            {home.documents.map((document) => (
              <li key={document.id}>
                <a
                  href={`/api/documents/${document.id}/download`}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3 hover:bg-black/5"
                >
                  <span>
                    <span className="font-medium">{document.file_name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {DOCUMENT_TYPE_LABELS[document.document_type]}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(document.uploaded_at)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
