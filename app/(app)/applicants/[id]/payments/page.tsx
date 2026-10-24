import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ComingSoon } from "@/components/layout/coming-soon";
import { requirePermission } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Payments" };

export default async function ApplicantPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const { id } = await params;
  if (!can(profile, "add_payment") && !can(profile, "view_financials")) {
    redirect(`/applicants/${id}`);
  }
  return <ComingSoon section="Payments" milestone="Milestone 4 (training and payments)" />;
}
