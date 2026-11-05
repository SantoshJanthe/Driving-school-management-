import "server-only";

export type ReminderChannel = "sms" | "whatsapp";

/** A channel can send only when both a key and a URL are already in the environment. */
export function reminderProvider(channel: ReminderChannel): { connected: false } | { connected: true; url: string; key: string } {
  const keyName = channel === "sms" ? "SMS_PROVIDER_KEY" : "WHATSAPP_PROVIDER_KEY";
  const urlName = channel === "sms" ? "SMS_PROVIDER_URL" : "WHATSAPP_PROVIDER_URL";
  const key = process.env[keyName]?.trim() ?? "";
  const url = process.env[urlName]?.trim() ?? "";
  if (!key || !url) return { connected: false };
  return { connected: true, url, key };
}
