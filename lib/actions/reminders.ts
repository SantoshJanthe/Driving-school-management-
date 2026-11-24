"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { reminderProvider, type ReminderChannel } from "@/lib/reminders/provider";
import { createClient } from "@/lib/supabase/server";

export type ReminderState = { error?: string; ok?: string };

const CHANNELS = ["sms", "whatsapp"] as const;
const KINDS = ["fee", "class"] as const;

export async function queueReminder(
  _prev: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  const profile = await requireAdmin();
  const applicantId = String(formData.get("applicant_id") ?? "");
  const channel = String(formData.get("channel") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!CHANNELS.includes(channel as ReminderChannel)) return { error: "Choose SMS or WhatsApp." };
  if (!KINDS.includes(kind as (typeof KINDS)[number])) return { error: "Choose a fee or class reminder." };
  if (body.length < 1 || body.length > 500) return { error: "Write a reminder of up to 500 characters." };

  const supabase = await createClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, school_id, phone, full_name")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant || applicant.school_id !== profile.school_id) {
    return { error: "That applicant is not in your school." };
  }

  const provider = reminderProvider(channel as ReminderChannel);
  const { data: row, error } = await supabase
    .from("reminders")
    .insert({
      school_id: applicant.school_id,
      applicant_id: applicant.id,
      channel,
      kind,
      body,
      status: "recorded",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !row) return { error: error?.message ?? "Could not save the reminder." };

  if (!provider.connected) {
    revalidatePath(`/applicants/${applicant.id}`);
    return {
      ok: `${channel === "sms" ? "SMS" : "WhatsApp"} is not connected. The reminder was saved and was not sent.`,
    };
  }

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: applicant.phone,
        channel,
        kind,
        body,
      }),
    });
    if (!response.ok) {
      return { ok: "The reminder was saved. The provider did not accept it, so it was not marked sent." };
    }
  } catch {
    return { ok: "The reminder was saved. The provider could not be reached, so it was not marked sent." };
  }

  await supabase.from("reminders").update({ status: "sent" }).eq("id", row.id);
  revalidatePath(`/applicants/${applicant.id}`);
  return { ok: "Reminder sent." };
}
