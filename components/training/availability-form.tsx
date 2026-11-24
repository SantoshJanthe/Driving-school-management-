"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeInstructorHour, saveInstructorHours, type BookingState } from "@/lib/actions/booking";
import type { InstructorHours } from "@/lib/queries/booking";
import { WEEKDAYS } from "@/lib/training/constants";

const initial: BookingState = {};
const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AvailabilityForm({
  instructorId,
  hours,
}: {
  instructorId: string;
  hours: InstructorHours[];
}) {
  const [state, action] = useActionState(saveInstructorHours, initial);

  return (
    <section className="grid gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-5" aria-labelledby="hours-heading">
      <div className="grid gap-1">
        <h2 id="hours-heading" className="text-sm font-semibold tracking-wide uppercase">
          Hours students can book
        </h2>
        <p className="text-sm text-muted-foreground">
          Publish the hours you can take a lesson. Students only see a slot when it is still free.
        </p>
      </div>
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>Hour added.</AlertDescription>
        </Alert>
      ) : null}
      <form action={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
        <input type="hidden" name="instructor_id" value={instructorId} />
        <div className="grid gap-1.5">
          <Label htmlFor="hours-day">Weekday</Label>
          <select id="hours-day" name="weekday" required className={selectClass} defaultValue="1">
            {WEEKDAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hours-start">From</Label>
          <Input id="hours-start" name="start_time" type="time" required className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hours-end">To</Label>
          <Input id="hours-end" name="end_time" type="time" required className="h-11" />
        </div>
        <SubmitButton pendingText="Saving…" className="h-11">
          Add hour
        </SubmitButton>
      </form>
      {hours.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hours published yet.</p>
      ) : (
        <ul className="grid gap-2">
          {hours.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm"
            >
              <span>
                {WEEKDAYS[row.weekday]?.label ?? row.weekday} · {row.start_time}–{row.end_time}
              </span>
              <form action={removeInstructorHour}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="instructor_id" value={instructorId} />
                <Button type="submit" variant="outline" className="h-9">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
