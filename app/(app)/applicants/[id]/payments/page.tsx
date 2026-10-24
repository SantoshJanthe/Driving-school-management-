import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
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

  return (
    <div className="grid gap-3 rounded-xl border p-4">
      <h2 className="font-semibold">Razorpay</h2>
      <p className="text-sm text-muted-foreground">
        Online fees are collected with Razorpay’s Payment Links API. The link is created from the
        Payments section, with this applicant already selected.
      </p>
      <Button asChild className="h-11 w-fit">
        <Link href={`/payments?applicant=${id}`}>Create Razorpay link</Link>
      </Button>
    </div>
  );
}
