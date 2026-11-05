"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queueReminder, type ReminderState } from "@/lib/actions/reminders";

const initial: ReminderState = {};
const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm outline-none";

export function ReminderForm({
  applicantId,
  smsConnected,
  whatsAppConnected,
  reminders,
}: {
  applicantId: string;
  smsConnected: boolean;
  whatsAppConnected: boolean;
  reminders: { id: string; channel: string; kind: string; body: string; status: string; created_at: string }[];
}) {
  const [state, action] = useActionState(queueReminder, initial);

  return (
    <section className="grid gap-3 rounded-xl border border-black/10 bg-[#fffcf7] p-4">
      <h3 className="text-sm font-semibold">Fee and class reminders</h3>
      <p className="text-sm text-muted-foreground">
        {smsConnected ? "SMS is connected." : "SMS is not connected."}{" "}
        {whatsAppConnected ? "WhatsApp is connected." : "WhatsApp is not connected."} A reminder is
        stored either way. Nothing is sent while a provider is not connected.
      </p>
      <form action={action} className="grid gap-3">
        <input type="hidden" name="applicant_id" value={applicantId} />
        {state.error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        {state.ok ? (
          <Alert role="status">
            <AlertDescription>{state.ok}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="reminder-channel">Channel</Label>
            <select id="reminder-channel" name="channel" className={selectClass} defaultValue="sms">
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="reminder-kind">Kind</Label>
            <select id="reminder-kind" name="kind" className={selectClass} defaultValue="fee">
              <option value="fee">Fee reminder</option>
              <option value="class">Class reminder</option>
            </select>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reminder-body">Message</Label>
          <Textarea id="reminder-body" name="body" required maxLength={500} rows={3} />
        </div>
        <SubmitButton pendingText="Saving…" className="md:w-fit">
          Save reminder
        </SubmitButton>
      </form>
      {reminders.length > 0 ? (
        <ul className="grid gap-2 text-sm">
          {reminders.map((row) => (
            <li key={row.id}>
              <span className="font-medium capitalize">
                {row.channel} · {row.kind} · {row.status}
              </span>
              <span className="mt-0.5 block text-muted-foreground">{row.body}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
