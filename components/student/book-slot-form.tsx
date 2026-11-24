"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookLesson, type BookingState } from "@/lib/actions/booking";
import { formatDate } from "@/lib/format";
import type { OpenSlot } from "@/lib/queries/booking";

const initial: BookingState = {};

export function BookSlotForm({
  date,
  today,
  latest,
  slots,
  sessionId,
  sessionLabel,
}: {
  date: string;
  today: string;
  latest: string;
  slots: OpenSlot[];
  sessionId?: string;
  sessionLabel?: string;
}) {
  const [state, action] = useActionState(bookLesson, initial);

  return (
    <section className="grid gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-5" aria-labelledby="book-heading">
      <div className="grid gap-1">
        <h2 id="book-heading" className="text-sm font-semibold tracking-wide uppercase">
          {sessionId ? "Change this lesson" : "Book a time slot"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {sessionId
            ? `Pick a free hour to move ${sessionLabel}. Only hours the instructor has published, and that are still free, are listed.`
            : "Pick a day, then an hour that is still free on an instructor’s timetable."}
        </p>
      </div>

      <form method="get" action="/dashboard" className="flex flex-wrap items-end gap-3">
        {sessionId ? <input type="hidden" name="change" value={sessionId} /> : null}
        <div className="grid gap-1.5">
          <Label htmlFor="book-date">Day</Label>
          <Input
            id="book-date"
            name="date"
            type="date"
            required
            min={today}
            max={latest}
            defaultValue={date}
            className="h-11 w-44"
          />
        </div>
        <SubmitButton pendingText="Loading…" className="h-11">
          Show free hours
        </SubmitButton>
      </form>

      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>{sessionId ? "Lesson time updated." : "Lesson booked."}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-sm font-medium">{formatDate(date)}</p>
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No free instructor hours on this day. Try another day, or ask the school to publish hours.
        </p>
      ) : (
        <ul className="grid gap-2">
          {slots.map((slot) => (
            <li key={`${slot.instructor_id}-${slot.start_time}`}>
              <form action={action} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3">
                {sessionId ? <input type="hidden" name="session_id" value={sessionId} /> : null}
                <input type="hidden" name="instructor_id" value={slot.instructor_id} />
                <input type="hidden" name="session_date" value={slot.session_date} />
                <input type="hidden" name="start_time" value={slot.start_time} />
                <input type="hidden" name="end_time" value={slot.end_time} />
                <span>
                  <span className="font-medium">
                    {slot.start_time}–{slot.end_time}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{slot.instructor_name}</span>
                </span>
                <SubmitButton pendingText="Saving…" className="h-10">
                  {sessionId ? "Move here" : "Book this hour"}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
