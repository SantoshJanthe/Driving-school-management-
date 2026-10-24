import type { Metadata } from "next";
import { headers } from "next/headers";

import { PageHeader } from "@/components/layout/page-header";
import { PaymentLedger } from "@/components/payments/payment-ledger";
import { RazorpayPanel } from "@/components/payments/razorpay-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requirePermission } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { listPayableApplicants, listRecentPayments } from "@/lib/queries/payments";
import { razorpayStatus } from "@/lib/razorpay/server";

export const metadata: Metadata = { title: "Payments" };

async function origin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : env.appUrl;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ applicant?: string; razorpay?: string }>;
}) {
  const profile = await requirePermission("view_financials");
  const params = await searchParams;
  const [applicants, rows] = await Promise.all([listPayableApplicants(), listRecentPayments()]);
  const base = await origin();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Payments"
        description="Collect a fee with Razorpay. The payer pays on Razorpay’s page, and the paid amount is recorded here."
      />
      {params.razorpay === "returned" ? (
        <Alert>
          <AlertDescription>
            Returned from Razorpay. The payment appears in the list below once the webhook is
            delivered.
          </AlertDescription>
        </Alert>
      ) : null}
      <RazorpayPanel
        status={razorpayStatus()}
        applicants={applicants}
        selectedId={params.applicant}
        webhookUrl={`${base}/api/razorpay/webhook`}
        canCreate={can(profile, "add_payment")}
      />
      <PaymentLedger rows={rows} />
    </div>
  );
}
