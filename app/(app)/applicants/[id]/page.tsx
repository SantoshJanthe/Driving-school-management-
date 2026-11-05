import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LicenceChecklist } from "@/components/applicants/licence-checklist";
import { ReminderForm } from "@/components/applicants/reminder-form";
import { GENDER_LABELS } from "@/lib/applicants/labels";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/documents/constants";
import { formatDate, formatINR, formatPhone } from "@/lib/format";
import { requirePermission } from "@/lib/auth/guards";
import { can, isAdmin } from "@/lib/auth/permissions";
import { reminderProvider } from "@/lib/reminders/provider";
import { getApplicant } from "@/lib/queries/applicants";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Applicant" };

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function ApplicantOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const { id } = await params;
  const applicant = await getApplicant(id);
  if (!applicant) notFound();
  const supabase = await createClient();
  const { data: checklist } = await supabase
    .from("applicants")
    .select("ll_number, ll_issued_on, dl_test_date, dl_result")
    .eq("id", id)
    .maybeSingle();
  const { data: documents } = await supabase
    .from("documents")
    .select("document_type")
    .eq("applicant_id", id)
    .eq("is_archived", false);
  const uploaded = new Set((documents ?? []).map((row) => row.document_type));
  const { data: reminders } = isAdmin(profile)
    ? await supabase
        .from("reminders")
        .select("id, channel, kind, body, status, created_at")
        .eq("applicant_id", id)
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: [] };
  const required: DocumentType[] = DOCUMENT_TYPES.filter((type) => type !== "other");
  const missing = required.filter((type) => !uploaded.has(type));

  const address = [applicant.address, applicant.city, applicant.state, applicant.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="grid gap-3">
          <h3 className="text-sm font-semibold">Personal</h3>
          <dl className="grid gap-3">
            <Item
              label="Date of birth"
              value={applicant.date_of_birth ? formatDate(applicant.date_of_birth) : null}
            />
            <Item
              label="Gender"
              value={applicant.gender ? GENDER_LABELS[applicant.gender] : null}
            />
            <Item
              label="Alt. phone"
              value={
                applicant.alternate_phone ? (
                  <a
                    href={`tel:${applicant.alternate_phone}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {formatPhone(applicant.alternate_phone)}
                  </a>
                ) : null
              }
            />
            <Item label="Email" value={applicant.email} />
            <Item label="Address" value={address || null} />
            <Item
              label="Aadhaar"
              value={applicant.aadhaar_last4 ? `•••• ${applicant.aadhaar_last4}` : null}
            />
          </dl>
        </section>
        <section className="grid gap-3">
          <h3 className="text-sm font-semibold">Application</h3>
          <dl className="grid gap-3">
            <Item label="Licence category" value={applicant.license_category} />
            <Item label="Application no." value={applicant.application_number} />
            <Item label="SARATHI reference" value={applicant.sarathi_reference} />
            <Item label="SARATHI status" value={applicant.sarathi_status} />
            <Item
              label="SARATHI checked"
              value={applicant.sarathi_checked_on ? formatDate(applicant.sarathi_checked_on) : null}
            />
            <Item label="Total fee" value={formatINR(applicant.total_fee)} />
            <Item label="Amount paid" value={formatINR(applicant.amount_paid)} />
            <Item label="Balance" value={formatINR(applicant.balance_due)} />
            <Item label="Assigned staff" value={applicant.assigned_staff_name} />
            <Item
              label="Created"
              value={`${formatDate(applicant.created_at)}${applicant.created_by_name ? ` by ${applicant.created_by_name}` : ""}`}
            />
          </dl>
        </section>
      </div>
      <LicenceChecklist
        applicantId={applicant.id}
        llNumber={checklist?.ll_number ?? ""}
        llIssuedOn={checklist?.ll_issued_on ?? ""}
        dlTestDate={checklist?.dl_test_date ?? ""}
        dlResult={checklist?.dl_result ?? ""}
        missing={missing}
        canEdit={can(profile, "edit_applicant")}
      />
      {isAdmin(profile) ? (
        <ReminderForm
          applicantId={applicant.id}
          smsConnected={reminderProvider("sms").connected}
          whatsAppConnected={reminderProvider("whatsapp").connected}
          reminders={reminders ?? []}
        />
      ) : null}
      <section className="grid gap-2">
        <h3 className="text-sm font-semibold">Notes</h3>
        <p className="text-sm whitespace-pre-wrap">{applicant.notes || "—"}</p>
      </section>
    </div>
  );
}
