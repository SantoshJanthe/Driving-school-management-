import type { Metadata } from "next";

import { ApplicantForm, EMPTY_APPLICANT_FORM } from "@/components/applicants/applicant-form";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { listStaffOptions } from "@/lib/queries/applicants";

export const metadata: Metadata = { title: "New applicant" };

export default async function NewApplicantPage() {
  await requirePermission("create_applicant");
  const staff = await listStaffOptions();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="New applicant"
        description="Personal details and the application record."
      />
      <ApplicantForm defaults={EMPTY_APPLICANT_FORM} staff={staff} cancelHref="/applicants" />
    </div>
  );
}
