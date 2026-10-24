import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Documents" };

export default async function ApplicantDocumentsPage() {
  await requirePermission("view_applicants");
  return <ComingSoon section="Documents" milestone="Milestone 5 (documents and history)" />;
}
