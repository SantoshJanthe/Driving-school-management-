"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSession, type SessionFormState } from "@/lib/actions/training";
import type { ApplicantOption, SessionRow, StaffOption } from "@/lib/queries/training";
import {
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  VEHICLE_TYPES,
  kolkataDate,
} from "@/lib/training/constants";

const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const initial: SessionFormState = {};

export function SessionDialog({
  applicants,
  staff,
  returnTo,
  session,
  lockedApplicantId,
}: {
  applicants?: ApplicantOption[];
  staff: StaffOption[];
  returnTo: string;
  session?: SessionRow;
  lockedApplicantId?: string;
}) {
  const [state, action] = useActionState(saveSession, initial);
  const editing = !!session;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {editing ? (
          <Button type="button" variant="ghost" size="sm">
            <Pencil aria-hidden />
            Edit
          </Button>
        ) : (
          <Button type="button" className="h-11">
            <Plus aria-hidden />
            Add session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit session" : "Add session"}</DialogTitle>
          <DialogDescription>
            Date, time, vehicle, and instructor for this lesson.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          {state.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <input type="hidden" name="return_to" value={returnTo} />
          {session ? <input type="hidden" name="id" value={session.id} /> : null}
          {lockedApplicantId ? (
            <input type="hidden" name="applicant_id" value={lockedApplicantId} />
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="session-applicant">Applicant</Label>
              <select
                id="session-applicant"
                name="applicant_id"
                className={selectClass}
                defaultValue={session?.applicant_id ?? ""}
                required
              >
                <option value="" disabled>
                  Choose an applicant
                </option>
                {(applicants ?? []).map((applicant) => (
                  <option key={applicant.id} value={applicant.id}>
                    {applicant.full_name}
                    {applicant.application_number ? ` · ${applicant.application_number}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                name="session_date"
                type="date"
                required
                defaultValue={session?.session_date ?? kolkataDate()}
                className="h-11"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="session-start">Start</Label>
              <Input
                id="session-start"
                name="start_time"
                type="time"
                defaultValue={session?.start_time?.slice(0, 5) ?? "09:00"}
                className="h-11"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="session-end">End</Label>
              <Input
                id="session-end"
                name="end_time"
                type="time"
                defaultValue={session?.end_time?.slice(0, 5) ?? "10:00"}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="session-vehicle">Vehicle</Label>
              <select
                id="session-vehicle"
                name="vehicle_type"
                className={selectClass}
                defaultValue={session?.vehicle_type ?? "LMV"}
              >
                <option value="">—</option>
                {VEHICLE_TYPES.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>
                    {vehicle}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="session-instructor">Instructor</Label>
              <select
                id="session-instructor"
                name="instructor_id"
                className={selectClass}
                defaultValue={session?.instructor_id ?? ""}
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="session-status">Status</Label>
            <select
              id="session-status"
              name="status"
              className={selectClass}
              defaultValue={session?.status ?? "scheduled"}
            >
              {SESSION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SESSION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="session-remarks">Remarks</Label>
            <Textarea
              id="session-remarks"
              name="remarks"
              defaultValue={session?.remarks ?? ""}
              rows={3}
              maxLength={500}
            />
          </div>
          <SubmitButton pendingText="Saving…" className="md:w-fit">
            {editing ? "Save session" : "Add session"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
