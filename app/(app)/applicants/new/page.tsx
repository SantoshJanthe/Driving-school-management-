import type { Metadata } from "next";

import { ApplicantForm, EMPTY_APPLICANT_FORM } from "@/components/applicants/applicant-form";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { listStaffOptions } from "@/lib/queries/applicants";
import { DEFAULT_PACKAGES } from "@/lib/school/packages";
import { getOwnSchool } from "@/lib/queries/school";

export const metadata: Metadata = { title: "New applicant" };

export default async function NewApplicantPage() {
  await requirePermission("create_applicant");
  const [staff, school] = await Promise.all([listStaffOptions(), getOwnSchool()]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="New applicant"
        description="Choose a course, then add the personal details. Website enquiries already appear in this list."
      />
      <ApplicantForm
        defaults={EMPTY_APPLICANT_FORM}
        staff={staff}
        packages={school?.packages ?? DEFAULT_PACKAGES}
        cancelHref="/applicants"
      />
    </div>
  );
}
