"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLessonLocation, type LocationState } from "@/lib/actions/locations";

const initial: LocationState = {};

export function LocationForm({ sessionId, student }: { sessionId: string; student: string }) {
  const [state, action] = useActionState(saveLessonLocation, initial);

  return (
    <form action={action} className="mt-2 grid gap-2 rounded-xl border border-black/10 bg-white/70 p-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-xs text-muted-foreground">
        Last place for {student}. This is a saved point, not a live tracker.
      </p>
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>Location saved for the admin.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor={`place-${sessionId}`}>Place</Label>
          <Input id={`place-${sessionId}`} name="label" required maxLength={80} className="h-11" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`lat-${sessionId}`}>Latitude</Label>
          <Input id={`lat-${sessionId}`} name="latitude" inputMode="decimal" required className="h-11" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`lng-${sessionId}`}>Longitude</Label>
          <Input id={`lng-${sessionId}`} name="longitude" inputMode="decimal" required className="h-11" />
        </div>
      </div>
      <SubmitButton pendingText="Saving…" className="md:w-fit">
        Save location
      </SubmitButton>
    </form>
  );
}
