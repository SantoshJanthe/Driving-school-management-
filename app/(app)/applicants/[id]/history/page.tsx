import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityList } from "@/components/applicants/activity-list";
import { requirePermission } from "@/lib/auth/guards";
import { getApplicant, listApplicantActivity } from "@/lib/queries/applicants";

export const metadata: Metadata = { title: "Applicant history" };

export default async function ApplicantHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("view_applicants");
  const { id } = await params;
  const applicant = await getApplicant(id);
  if (!applicant) notFound();
  const entries = await listApplicantActivity(id);

  return <ActivityList entries={entries} />;
}
