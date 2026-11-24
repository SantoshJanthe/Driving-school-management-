import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requirePlatformOwner } from "@/lib/auth/guards";
import { rejectSubscription, verifySubscription } from "@/lib/actions/subscription";
import { formatDateTime, formatINR } from "@/lib/format";
import { offeredMethods } from "@/lib/subscription/methods";
import { listRequests } from "@/lib/subscription/requests";
import { PaymentMethodsForm } from "@/components/vendor/payment-methods-form";

export const metadata: Metadata = { title: "Subscriptions" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = { pending: "Waiting", verified: "Verified", rejected: "Rejected" } as const;
const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  bank: "bank transfer",
  razorpay: "Razorpay",
};

export default async function VendorSubscriptionsPage() {
  await requirePlatformOwner();

  const [requests, offered] = await Promise.all([listRequests(), offeredMethods()]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Subscription payments"
        description="Razorpay payments verify themselves. Match each manual transaction ID with your bank statement; verifying opens the app download for that school."
      />
      <PaymentMethodsForm
        razorpay={offered.choice.razorpay}
        manual={offered.choice.manual}
        razorpayConnected={offered.razorpayConnected}
        manualReady={offered.manualReady}
        hasFee={offered.config.monthlyFee !== null}
      />
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment references yet.</p>
      ) : (
        <ul className="grid gap-4">
          {requests.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-2xl border border-black/10 bg-[#fffcf7] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium">{item.school_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.owner_name} · {item.phone}
                    {item.email ? ` · ${item.email}` : ""}
                  </p>
                </div>
                <Badge variant={item.status === "pending" ? "secondary" : "outline"}>
                  {STATUS_LABEL[item.status]}
                </Badge>
              </div>
              <p className="text-sm">
                {formatINR(item.amount_inr)} by {METHOD_LABEL[item.payment_method] ?? item.payment_method} ·{" "}
                <span className="font-mono">{item.payment_reference}</span> · sent{" "}
                {formatDateTime(item.created_at)}
              </p>
              {item.status === "pending" ? (
                <form action={verifySubscription} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <Input
                    name="note"
                    placeholder="Note for the buyer (optional)"
                    maxLength={300}
                    className="h-11 min-w-64 flex-1"
                    aria-label="Note for the buyer"
                  />
                  <Button type="submit" className="h-11">
                    Verify payment
                  </Button>
                  <Button type="submit" formAction={rejectSubscription} variant="outline" className="h-11">
                    Reject
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {item.reviewed_at ? `Reviewed ${formatDateTime(item.reviewed_at)}` : null}
                  {item.review_note ? ` · ${item.review_note}` : null}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
