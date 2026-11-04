"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { issueStudentLogin, type IssueLoginState } from "@/lib/actions/student-login";

const initial: IssueLoginState = {};

export function IssueStudentLogin({
  applicantId,
  defaultEmail,
  existingEmail,
}: {
  applicantId: string;
  defaultEmail: string;
  existingEmail: string | null;
}) {
  const [state, action] = useActionState(issueStudentLogin, initial);

  return (
    <section className="grid gap-3 rounded-xl border border-black/10 bg-[#fffcf7] p-4">
      <h3 className="text-sm font-semibold">Student login</h3>
      {existingEmail && !state.issued ? (
        <p className="text-sm text-muted-foreground">
          A login already exists for{" "}
          <span className="font-medium text-foreground">{existingEmail}</span>. The password was
          shown once when it was issued.
        </p>
      ) : null}
      {state.issued ? (
        <Alert role="status">
          <AlertDescription>
            <span className="block font-medium">
              Give these details to the learner now. The password is not shown again.
            </span>
            <span className="mt-2 block font-mono text-sm">
              {state.issued.email}
              <br />
              {state.issued.password}
            </span>
          </AlertDescription>
        </Alert>
      ) : null}
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {!existingEmail && !state.issued ? (
        <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <input type="hidden" name="applicant_id" value={applicantId} />
          <div className="grid gap-1.5">
            <Label htmlFor="student-email">Email for the student login</Label>
            <Input
              id="student-email"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              autoComplete="off"
              className="h-11"
            />
          </div>
          <SubmitButton pendingText="Issuing…" className="sm:w-auto">
            Issue student login
          </SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
