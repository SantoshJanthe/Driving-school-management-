import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApplicantForm, type ApplicantFormDefaults } from "@/components/applicants/applicant-form";
import { requirePermission } from "@/lib/auth/guards";
import { getApplicant, listStaffOptions } from "@/lib/queries/applicants";
import { DEFAULT_PACKAGES } from "@/lib/school/packages";
import { getOwnSchool } from "@/lib/queries/school";

export const metadata: Metadata = { title: "Edit applicant" };

export default async function EditApplicantPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("edit_applicant");
  const { id } = await params;
  const [applicant, staff, school] = await Promise.all([
    getApplicant(id),
    listStaffOptions(),
    getOwnSchool(),
  ]);
  if (!applicant) notFound();

  const defaults: ApplicantFormDefaults = {
    full_name: applicant.full_name,
    phone: applicant.phone,
    alternate_phone: applicant.alternate_phone ?? "",
    email: applicant.email ?? "",
    date_of_birth: applicant.date_of_birth ?? "",
    gender: applicant.gender ?? "",
    address: applicant.address ?? "",
    city: applicant.city ?? "",
    state: applicant.state ?? "",
    pincode: applicant.pincode ?? "",
    aadhaar_last4: applicant.aadhaar_last4 ?? "",
    application_number: applicant.application_number ?? "",
    sarathi_reference: applicant.sarathi_reference ?? "",
    sarathi_status: applicant.sarathi_status ?? "",
    sarathi_checked_on: applicant.sarathi_checked_on ?? "",
    license_category: applicant.license_category ?? "",
    application_status: applicant.application_status,
    training_status: applicant.training_status,
    total_fee: String(applicant.total_fee),
    assigned_staff_id: applicant.assigned_staff_id ?? "",
    notes: applicant.notes ?? "",
  };

  return (
    <ApplicantForm
      applicantId={applicant.id}
      defaults={defaults}
      staff={staff}
      packages={school?.packages ?? DEFAULT_PACKAGES}
      cancelHref={`/applicants/${applicant.id}`}
    />
  );
}
