import "server-only";

import { razorpayStatus } from "@/lib/razorpay/server";
import { paymentConfig, type PaymentConfig } from "@/lib/subscription/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type MethodChoice = { razorpay: boolean; manual: boolean };

const DEFAULT_CHOICE: MethodChoice = { razorpay: false, manual: true };

/** What the vendor switched on in /vendor/subscriptions. */
export async function methodChoice(): Promise<MethodChoice> {
  const { data, error } = await createAdminClient()
    .from("platform_settings")
    .select("value")
    .eq("key", "subscription_payment_methods")
    .maybeSingle();
  if (error || !data || !data.value || typeof data.value !== "object" || Array.isArray(data.value)) {
    return DEFAULT_CHOICE;
  }
  const value = data.value as Record<string, unknown>;
  return { razorpay: value.razorpay === true, manual: value.manual === true };
}

export type OfferedMethods = {
  config: PaymentConfig;
  choice: MethodChoice;
  razorpayConnected: boolean;
  manualReady: boolean;
  /** A method is offered only when it is switched on and can actually take money. */
  razorpay: boolean;
  manual: boolean;
};

export async function offeredMethods(): Promise<OfferedMethods> {
  const config = paymentConfig();
  const choice = await methodChoice();
  const razorpayConnected = razorpayStatus().configured;
  const hasFee = config.monthlyFee !== null;
  const manualReady = config.upiId !== null || config.bankDetails !== null;
  return {
    config,
    choice,
    razorpayConnected,
    manualReady,
    razorpay: hasFee && choice.razorpay && razorpayConnected,
    manual: hasFee && choice.manual && manualReady,
  };
}
