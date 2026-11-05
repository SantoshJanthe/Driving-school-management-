import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/constants";
import { formatDate, formatINR, formatPhone } from "@/lib/format";
import type { StudentHome, StudentSession } from "@/lib/queries/student-home";
import { ATTENDANCE_LABELS } from "@/lib/training/constants";

function clock(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function sessionLine(session: StudentSession) {
  const time = [clock(session.start_time), clock(session.end_time)].filter(Boolean).join("–");
  return [formatDate(session.session_date), time].filter(Boolean).join(" · ");
}

function SessionItem({ session }: { session: StudentSession }) {
  return (
    <li className="rounded-xl border border-black/10 bg-white/60 px-4 py-3">
      <p className="font-medium">{sessionLine(session)}</p>
      <p className="text-sm text-muted-foreground">
        {session.attendance ? ATTENDANCE_LABELS[session.attendance] : "Attendance not marked"}
        {session.vehicle_type ? ` · ${session.vehicle_type}` : ""}
        {session.instructor_name ? ` · ${session.instructor_name}` : ""}
      </p>
    </li>
  );
}

const RESULT_LABELS: Record<string, string> = {
  pending: "Pending",
  pass: "Pass",
  fail: "Fail",
};

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
      <PageHeader title={home.full_name} description="Your record with the school. You cannot change it." />

      <section className="grid gap-3 rounded-2xl border border-black/10 bg-[#fffcf7] p-5" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="text-sm font-semibold tracking-wide uppercase">
          Profile
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Name</dt>
            <dd>{home.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Phone</dt>
            <dd>{formatPhone(home.phone)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Application number</dt>
            <dd>{home.application_number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Licence category</dt>
            <dd>{home.license_category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Application status</dt>
            <dd>{home.application_status}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Training status</dt>
            <dd>{home.training_status}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-3" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-sm font-semibold tracking-wide uppercase">
          Upcoming lessons
        </h2>
        {home.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming lessons.</p>
        ) : (
          <ul className="grid gap-2">
            {home.upcoming.map((session) => (
              <li key={session.id} className="rounded-xl border border-black/10 bg-white/60 px-4 py-3">
                <p className="font-medium">{sessionLine(session)}</p>
                <p className="text-sm text-muted-foreground">
                  {session.vehicle_type ?? "Vehicle not set"}
                  {session.instructor_name ? ` · ${session.instructor_name}` : ""}
                  {session.attendance ? ` · ${ATTENDANCE_LABELS[session.attendance]}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3" aria-labelledby="past-heading">
        <h2 id="past-heading" className="text-sm font-semibold tracking-wide uppercase">
          Past sessions
        </h2>
        {home.past.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past sessions.</p>
        ) : (
          <ul className="grid gap-2">
            {home.past.map((session) => (
              <SessionItem key={session.id} session={session} />
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl border border-black/10 bg-[#fffcf7] p-5" aria-labelledby="fee-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="fee-heading" className="text-sm font-semibold tracking-wide uppercase">
            Fees
          </h2>
          <Link href="/my-receipt" className="text-sm underline-offset-4 hover:underline">
            Open receipt
          </Link>
        </div>
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
        {home.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="grid gap-2">
            {home.payments.map((payment) => (
              <li key={payment.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {formatDate(payment.payment_date)} · {payment.payment_mode}
                  {payment.receipt_number ? ` · ${payment.receipt_number}` : ""}
                </span>
                <span className="font-medium">{formatINR(payment.amount)}</span>
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
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3"
              >
                <span>
                  <span className="font-medium">{document.file_name}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[document.document_type]} · {formatDate(document.uploaded_at)}
                  </span>
                </span>
                <span className="flex gap-3 text-sm">
                  <a className="underline-offset-4 hover:underline" href={`/api/documents/${document.id}/download`}>
                    View
                  </a>
                  <a
                    className="underline-offset-4 hover:underline"
                    href={`/api/documents/${document.id}/download?attachment=1`}
                  >
                    Download
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3" aria-labelledby="checklist-heading">
        <h2 id="checklist-heading" className="text-sm font-semibold tracking-wide uppercase">
          Licence checklist
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Learner&apos;s licence</dt>
            <dd>
              {home.ll_number ?? "Not recorded"}
              {home.ll_issued_on ? ` · ${formatDate(home.ll_issued_on)}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Driving test</dt>
            <dd>
              {home.dl_test_date ? formatDate(home.dl_test_date) : "No date"}
              {home.dl_result ? ` · ${RESULT_LABELS[home.dl_result] ?? home.dl_result}` : ""}
            </dd>
          </div>
        </dl>
        <p className="text-sm">
          Still missing:{" "}
          {home.missing_documents.length === 0
            ? "None"
            : home.missing_documents.map((type) => DOCUMENT_TYPE_LABELS[type]).join(", ")}
        </p>
      </section>
    </div>
  );
}
