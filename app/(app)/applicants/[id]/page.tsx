import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GENDER_LABELS } from "@/lib/applicants/labels";
import { formatDate, formatINR, formatPhone } from "@/lib/format";
import { requirePermission } from "@/lib/auth/guards";
import { getApplicant } from "@/lib/queries/applicants";

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
  await requirePermission("view_applicants");
  const { id } = await params;
  const applicant = await getApplicant(id);
  if (!applicant) notFound();

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
      <section className="grid gap-2">
        <h3 className="text-sm font-semibold">Notes</h3>
        <p className="text-sm whitespace-pre-wrap">{applicant.notes || "—"}</p>
      </section>
    </div>
  );
}
