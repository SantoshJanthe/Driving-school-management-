import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Training" };

export default async function ApplicantTrainingPage() {
  await requirePermission("view_applicants");
  return <ComingSoon section="Training sessions" milestone="Milestone 4 (training and payments)" />;
}
