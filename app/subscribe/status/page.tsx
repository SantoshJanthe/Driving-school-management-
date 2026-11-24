import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicShell } from "@/components/marketing/public-shell";
import { StatusRefresh } from "@/components/marketing/status-refresh";
import { formatINR } from "@/lib/format";
import { requestForToken } from "@/lib/subscription/requests";

export const metadata: Metadata = { title: "Payment status", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function SubscribeStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const request = await requestForToken(token);

  if (!request) {
    return (
      <PublicShell>
        <h1 className="text-2xl font-medium tracking-tight">Link not recognised</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the link from the page you saw after sending your payment reference.
        </p>
        <Link href="/#subscribe" className="mt-4 inline-block text-sm underline underline-offset-4">
          Back to the subscription
        </Link>
      </PublicShell>
    );
  }

  if (request.status === "verified") redirect(`/download?token=${token}`);

  return (
    <PublicShell>
      {request.status === "pending" ? <StatusRefresh /> : null}
      <p className="text-xs font-medium tracking-[0.18em] text-[#8a7355] uppercase">
        {request.status === "pending" ? "Checking your payment" : "Payment not verified"}
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">
        {request.status !== "pending"
          ? "We could not match this payment."
          : request.payment_method === "razorpay"
            ? "Waiting for Razorpay to confirm the payment."
            : "We are matching your transaction ID with the bank."}
      </h1>
      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="text-muted-foreground">School</dt>
        <dd>{request.school_name}</dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd>{formatINR(request.amount_inr)} for one month</dd>
        <dt className="text-muted-foreground">Reference</dt>
        <dd className="font-mono">{request.payment_reference}</dd>
      </dl>
      {request.status === "pending" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Keep this page open or bookmark it. It opens the app download as soon as the payment is
          verified.
        </p>
      ) : (
        <div className="mt-6 grid gap-2 text-sm">
          {request.review_note ? <p>Note from the vendor: {request.review_note}</p> : null}
          <Link href="/#subscribe" className="underline underline-offset-4">
            Try the payment again
          </Link>
        </div>
      )}
    </PublicShell>
  );
}
