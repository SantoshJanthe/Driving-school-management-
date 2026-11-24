"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setSchoolAccess, type SchoolAccessState } from "@/lib/actions/schools";

const initial: SchoolAccessState = {};

export function SchoolAccessForm({
  schoolId,
  active,
  isOwnSchool,
}: {
  schoolId: string;
  active: boolean;
  isOwnSchool: boolean;
}) {
  const [state, action] = useActionState(setSchoolAccess, initial);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="school_id" value={schoolId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert role="status">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <SubmitButton
        variant={active ? "destructive" : "outline"}
        className="sm:w-fit"
        pendingText="Saving…"
        disabled={active && isOwnSchool}
        title={active && isOwnSchool ? "This is the school your own login belongs to" : undefined}
      >
        {active ? "Pause access" : "Restore access"}
      </SubmitButton>
    </form>
  );
}
