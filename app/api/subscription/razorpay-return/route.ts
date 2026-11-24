import { NextResponse } from "next/server";

import { verifyPaymentLinkCallback } from "@/lib/razorpay/server";
import { markRazorpayPaid, requestForToken } from "@/lib/subscription/requests";

export const runtime = "nodejs";

/**
 * Razorpay sends the payer here after checkout. The query is signed with the key
 * secret; only a valid signature for this request's link marks it paid. The
 * webhook does the same, so a closed browser tab still unlocks the download.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const subscription = await requestForToken(token);
  if (!subscription) return NextResponse.redirect(new URL("/#subscribe", url));

  const linkId = url.searchParams.get("razorpay_payment_link_id") ?? "";
  const referenceId = url.searchParams.get("razorpay_payment_link_reference_id") ?? "";
  const status = url.searchParams.get("razorpay_payment_link_status") ?? "";
  const paymentId = url.searchParams.get("razorpay_payment_id") ?? "";
  const signature = url.searchParams.get("razorpay_signature") ?? "";

  if (
    status === "paid" &&
    referenceId === subscription.id &&
    verifyPaymentLinkCallback({ linkId, referenceId, status, paymentId, signature })
  ) {
    await markRazorpayPaid({ requestId: subscription.id, linkId, paymentId, amountPaise: null });
  }

  return NextResponse.redirect(new URL(`/subscribe/status?token=${token}`, url));
}
