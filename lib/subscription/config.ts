import "server-only";

export type PaymentConfig = {
  monthlyFee: number | null;
  payeeName: string | null;
  upiId: string | null;
  bankDetails: string | null;
};

function text(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Payment details come from the server environment. Nothing here is invented. */
export function paymentConfig(): PaymentConfig {
  const fee = Number(process.env.SUBSCRIPTION_MONTHLY_FEE);
  return {
    monthlyFee: Number.isFinite(fee) && fee > 0 ? fee : null,
    payeeName: text(process.env.PAYMENT_PAYEE_NAME),
    upiId: text(process.env.PAYMENT_UPI_ID),
    bankDetails: text(process.env.PAYMENT_BANK_DETAILS)?.replace(/\\n/g, "\n") ?? null,
  };
}

export function paymentReady(config: PaymentConfig) {
  return config.monthlyFee !== null && (config.upiId !== null || config.bankDetails !== null);
}

/** Emails allowed to verify subscription payments. Compared with the signed-in auth email. */
export function isPlatformOwner(email: string | null | undefined) {
  if (!email) return false;
  const owners = (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.trim().toLowerCase());
}

export function upiLink(config: PaymentConfig) {
  if (!config.upiId || config.monthlyFee === null) return null;
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: config.payeeName ?? "MOTOR DRIVING SCHOOL SOFTWARE",
    am: config.monthlyFee.toFixed(2),
    cu: "INR",
    tn: "Monthly subscription",
  });
  return `upi://pay?${params.toString()}`;
}

export const APK_FILE = "var/downloads/motor-driving-school-software.apk";
