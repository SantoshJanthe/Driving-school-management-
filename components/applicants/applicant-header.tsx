"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { ApplicationStatusBadge, TrainingStatusBadge } from "@/components/applicants/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changeApplicantStatus,
  deleteApplicant,
  type ApplicantFormState,
} from "@/lib/actions/applicants";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABELS,
} from "@/lib/applicants/labels";
import { formatINR, formatPhone } from "@/lib/format";
import type { ApplicantDetail } from "@/lib/queries/applicants";

const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const initialState: ApplicantFormState = {};

export function ApplicantHeader({
  applicant,
  canEdit,
  isAdmin,
}: {
  applicant: ApplicantDetail;
  canEdit: boolean;
  isAdmin: boolean;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusState, statusAction] = useActionState(changeApplicantStatus, initialState);
  const [deleteState, deleteAction] = useActionState(deleteApplicant, initialState);

  return (
    <div className="rounded-xl border p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-2">
          <h2 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
            {applicant.full_name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Application no:{" "}
              <span className="font-medium text-foreground">
                {applicant.application_number ?? "—"}
              </span>
            </span>
            <a
              href={`tel:${applicant.phone}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {formatPhone(applicant.phone)}
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <ApplicationStatusBadge status={applicant.application_status} />
            <TrainingStatusBadge status={applicant.training_status} />
          </div>
          <p className="text-sm">
            Balance: <span className="font-semibold">{formatINR(applicant.balance_due)}</span>
            <span className="text-muted-foreground">
              {" "}
              (paid {formatINR(applicant.amount_paid)} of {formatINR(applicant.total_fee)})
            </span>
            {applicant.assigned_staff_name ? (
              <span className="text-muted-foreground">
                {" "}
                · Staff: {applicant.assigned_staff_name}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canEdit ? (
            <Button variant="outline" size="sm" asChild className="h-9">
              <Link href={`/applicants/${applicant.id}/edit`}>
                <Pencil aria-hidden />
                Edit
              </Link>
            </Button>
          ) : null}
          {canEdit || isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Applicant actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit ? (
                  <DropdownMenuItem onSelect={() => setStatusOpen(true)}>
                    Change status
                  </DropdownMenuItem>
                ) : null}
                {isAdmin ? (
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change status</DialogTitle>
            <DialogDescription>This is recorded in the applicant history.</DialogDescription>
          </DialogHeader>
          <form action={statusAction} className="grid gap-4">
            <input type="hidden" name="id" value={applicant.id} />
            {statusState.error ? (
              <Alert variant="destructive">
                <AlertDescription>{statusState.error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="status-application">Application status</Label>
              <select
                id="status-application"
                name="application_status"
                defaultValue={applicant.application_status}
                className={selectClass}
              >
                {APPLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {APPLICATION_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status-training">Training status</Label>
              <select
                id="status-training"
                name="training_status"
                defaultValue={applicant.training_status}
                className={selectClass}
              >
                {TRAINING_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {TRAINING_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <SubmitButton pendingText="Saving…" className="md:w-auto">
                Save status
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {applicant.full_name}?</DialogTitle>
            <DialogDescription>
              Payments, sessions and documents for this applicant are removed. The history entry is
              kept. Type the name to confirm.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteAction} className="grid gap-4">
            <input type="hidden" name="id" value={applicant.id} />
            {deleteState.error ? (
              <Alert variant="destructive">
                <AlertDescription>{deleteState.error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="confirm_name">Applicant name</Label>
              <Input
                id="confirm_name"
                name="confirm_name"
                autoComplete="off"
                placeholder={applicant.full_name}
                className="h-11"
                aria-invalid={!!deleteState.fieldErrors?.confirm_name}
              />
              {deleteState.fieldErrors?.confirm_name ? (
                <p className="text-sm text-destructive">{deleteState.fieldErrors.confirm_name}</p>
              ) : null}
            </div>
            <DialogFooter>
              <SubmitButton pendingText="Deleting…" variant="destructive" className="md:w-auto">
                Delete applicant
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
