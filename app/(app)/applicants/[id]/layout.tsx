import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ApplicantHeader } from "@/components/applicants/applicant-header";
import { ApplicantNotice } from "@/components/applicants/applicant-notice";
import { ApplicantTabs } from "@/components/applicants/applicant-tabs";
import { requirePermission } from "@/lib/auth/guards";
import { can, isAdmin } from "@/lib/auth/permissions";
import { getApplicant } from "@/lib/queries/applicants";

export default async function ApplicantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const { id } = await params;
  const applicant = await getApplicant(id);
  if (!applicant) notFound();

  const showPayments = can(profile, "add_payment") || can(profile, "view_financials");

  return (
    <div className="grid gap-4">
      <Link
        href="/applicants"
        className="w-fit text-sm text-muted-foreground hover:text-foreground"
      >
        ‹ Applicants
      </Link>
      <Suspense>
        <ApplicantNotice />
      </Suspense>
      <ApplicantHeader
        applicant={applicant}
        canEdit={can(profile, "edit_applicant")}
        isAdmin={isAdmin(profile)}
      />
      <ApplicantTabs applicantId={applicant.id} showPayments={showPayments} />
      {children}
    </div>
  );
}
