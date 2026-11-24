"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/guards";
import { createRazorpayPaymentLink } from "@/lib/razorpay/server";
import { publicOrigin } from "@/lib/request-origin";
import { isPlatformOwner } from "@/lib/subscription/config";
import { offeredMethods } from "@/lib/subscription/methods";
import { newAccessToken } from "@/lib/subscription/requests";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { error?: string };

const buyerSchema = z.object({
  school_name: z.string().trim().min(2, "Enter the school name").max(120, "School name is too long"),
  owner_name: z.string().trim().min(2, "Enter your name").max(120, "Name is too long"),
  phone: z
    .string()
    .transform((value) => {
      let digits = value.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
      return digits;
    })
    .refine((value) => /^[6-9][0-9]{9}$/.test(value), "Enter a 10-digit Indian mobile number"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email"),
});

const manualSchema = buyerSchema.extend({
  payment_method: z.enum(["upi", "bank"], { message: "Choose how you paid" }),
  payment_reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{6,40}$/, "Enter the UPI transaction ID or bank reference from your receipt"),
});

function buyerFields(formData: FormData) {
  return {
    school_name: formData.get("school_name") ?? "",
    owner_name: formData.get("owner_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
  };
}

async function tooManyToday(phone: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await createAdminClient()
    .from("subscription_requests")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);
  return (count ?? 0) >= 3;
}

export async function submitSubscription(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const offered = await offeredMethods();
  if (!offered.manual || offered.config.monthlyFee === null) {
    return { error: "UPI and bank transfer are not offered right now." };
  }
  if (formData.get("paid") !== "on") {
    return { error: "Confirm that you have paid before sending the reference." };
  }
  const parsed = manualSchema.safeParse({
    ...buyerFields(formData),
    payment_method: formData.get("payment_method") ?? "",
    payment_reference: formData.get("payment_reference") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  if (await tooManyToday(parsed.data.phone)) {
    return { error: "This number already started three payments today. Wait for a reply." };
  }

  const { token, hash } = newAccessToken();
  const { error } = await createAdminClient().from("subscription_requests").insert({
    school_name: parsed.data.school_name,
    owner_name: parsed.data.owner_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    amount_inr: offered.config.monthlyFee,
    payment_method: parsed.data.payment_method,
    payment_reference: parsed.data.payment_reference,
    access_token_hash: hash,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "This payment reference was already submitted." };
    }
    return { error: "Could not save the payment reference. Try again." };
  }

  redirect(`/subscribe/status?token=${token}`);
}

export async function startRazorpaySubscription(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const offered = await offeredMethods();
  const fee = offered.config.monthlyFee;
  if (!offered.razorpay || fee === null) {
    return { error: "Razorpay is not offered right now." };
  }
  const parsed = buyerSchema.safeParse(buyerFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  if (await tooManyToday(parsed.data.phone)) {
    return { error: "This number already started three payments today. Wait for a reply." };
  }

  const admin = createAdminClient();
  const id = randomUUID();
  const { token, hash } = newAccessToken();
  const { error: insertError } = await admin.from("subscription_requests").insert({
    id,
    school_name: parsed.data.school_name,
    owner_name: parsed.data.owner_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    amount_inr: fee,
    payment_method: "razorpay",
    payment_reference: `RZP-${id.slice(0, 8).toUpperCase()}`,
    access_token_hash: hash,
  });
  if (insertError) return { error: "Could not start the payment. Try again." };

  let shortUrl: string;
  try {
    const origin = await publicOrigin();
    const link = await createRazorpayPaymentLink({
      amountPaise: Math.round(fee * 100),
      description: `Monthly subscription: ${parsed.data.school_name}`.slice(0, 255),
      referenceId: id,
      notes: { subscription_request_id: id },
      name: parsed.data.owner_name,
      contact: parsed.data.phone,
      email: parsed.data.email || null,
      callbackUrl: `${origin}/api/subscription/razorpay-return?token=${token}`,
    });
    await admin.from("subscription_requests").update({ payment_reference: link.id }).eq("id", id);
    shortUrl = link.shortUrl;
  } catch (cause) {
    await admin.from("subscription_requests").delete().eq("id", id);
    return {
      error: cause instanceof Error ? cause.message : "Razorpay could not start the payment.",
    };
  }

  redirect(shortUrl);
}

async function requireOwner() {
  await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformOwner(user.email)) redirect("/dashboard?denied=vendor");
  return { userId: user.id };
}

export type MethodsState = { error?: string; ok?: boolean };

export async function saveMethodChoice(
  _prev: MethodsState,
  formData: FormData,
): Promise<MethodsState> {
  const { userId } = await requireOwner();
  const razorpay = formData.get("razorpay") === "on";
  const manual = formData.get("manual") === "on";
  if (!razorpay && !manual) {
    return { error: "Keep at least one payment method on." };
  }
  const { error } = await createAdminClient()
    .from("platform_settings")
    .upsert({
      key: "subscription_payment_methods",
      value: { razorpay, manual },
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  if (error) return { error: "Could not save the payment methods." };
  revalidatePath("/");
  revalidatePath("/vendor/subscriptions");
  return { ok: true };
}

export async function verifySubscription(formData: FormData) {
  await reviewSubscription(formData, "verified");
}

export async function rejectSubscription(formData: FormData) {
  await reviewSubscription(formData, "rejected");
}

async function reviewSubscription(formData: FormData, decision: "verified" | "rejected") {
  const { userId } = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  await createAdminClient()
    .from("subscription_requests")
    .update({
      status: decision,
      review_note: note || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");

  revalidatePath("/vendor/subscriptions");
}
