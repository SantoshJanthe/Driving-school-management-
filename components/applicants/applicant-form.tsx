"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveApplicant, type ApplicantFormState } from "@/lib/actions/applicants";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  GENDERS,
  GENDER_LABELS,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABELS,
  type ApplicationStatus,
  type TrainingStatus,
} from "@/lib/applicants/labels";
import type { StaffOption } from "@/lib/queries/applicants";

export type ApplicantFormDefaults = {
  full_name: string;
  phone: string;
  alternate_phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadhaar_last4: string;
  application_number: string;
  license_category: string;
  application_status: ApplicationStatus;
  training_status: TrainingStatus;
  total_fee: string;
  assigned_staff_id: string;
  notes: string;
};

export const EMPTY_APPLICANT_FORM: ApplicantFormDefaults = {
  full_name: "",
  phone: "",
  alternate_phone: "",
  email: "",
  date_of_birth: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  aadhaar_last4: "",
  application_number: "",
  license_category: "",
  application_status: "enquiry",
  training_status: "not_started",
  total_fee: "",
  assigned_staff_id: "",
  notes: "",
};

const controlClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

const initialState: ApplicantFormState = {};

export function ApplicantForm({
  applicantId,
  defaults,
  staff,
  cancelHref,
}: {
  applicantId?: string;
  defaults: ApplicantFormDefaults;
  staff: StaffOption[];
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(saveApplicant, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-8" noValidate>
      {applicantId ? <input type="hidden" name="id" value={applicantId} /> : null}
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Personal</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
            <Input
              id="full_name"
              name="full_name"
              required
              autoFocus
              defaultValue={defaults.full_name}
              className="h-11 text-base md:text-sm"
              autoComplete="name"
            />
          </Field>
          <Field label="Date of birth" htmlFor="date_of_birth" error={errors.date_of_birth}>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={defaults.date_of_birth}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender}>
            <select
              id="gender"
              name="gender"
              defaultValue={defaults.gender}
              className={controlClass}
            >
              <option value="">—</option>
              {GENDERS.map((value) => (
                <option key={value} value={value}>
                  {GENDER_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Phone"
            htmlFor="phone"
            error={errors.phone}
            hint="10-digit mobile. This is the main contact number."
          >
            <Input
              id="phone"
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="9876543210"
              defaultValue={defaults.phone}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="Alternate phone" htmlFor="alternate_phone" error={errors.alternate_phone}>
            <Input
              id="alternate_phone"
              name="alternate_phone"
              inputMode="tel"
              defaultValue={defaults.alternate_phone}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={defaults.email}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="Address" htmlFor="address" error={errors.address}>
            <Input
              id="address"
              name="address"
              defaultValue={defaults.address}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city}>
            <Input
              id="city"
              name="city"
              defaultValue={defaults.city}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="State" htmlFor="state" error={errors.state}>
            <Input
              id="state"
              name="state"
              defaultValue={defaults.state}
              placeholder="Maharashtra"
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field label="Pincode" htmlFor="pincode" error={errors.pincode}>
            <Input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              placeholder="411001"
              defaultValue={defaults.pincode}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field
            label="Aadhaar (last 4)"
            htmlFor="aadhaar_last4"
            error={errors.aadhaar_last4}
            hint="Last 4 digits only. Do not enter the full Aadhaar number."
          >
            <Input
              id="aadhaar_last4"
              name="aadhaar_last4"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="4321"
              defaultValue={defaults.aadhaar_last4}
              className="h-11 text-base md:text-sm"
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Application</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Application number"
            htmlFor="application_number"
            error={errors.application_number}
            hint="SARATHI number, entered by hand. Optional."
          >
            <Input
              id="application_number"
              name="application_number"
              placeholder="MH/2026/12345"
              defaultValue={defaults.application_number}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field
            label="Licence category"
            htmlFor="license_category"
            error={errors.license_category}
          >
            <Input
              id="license_category"
              name="license_category"
              placeholder="LMV, MCWG"
              defaultValue={defaults.license_category}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field
            label="Application status"
            htmlFor="application_status"
            error={errors.application_status}
          >
            <select
              id="application_status"
              name="application_status"
              defaultValue={defaults.application_status}
              className={controlClass}
            >
              {APPLICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {APPLICATION_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Training status" htmlFor="training_status" error={errors.training_status}>
            <select
              id="training_status"
              name="training_status"
              defaultValue={defaults.training_status}
              className={controlClass}
            >
              {TRAINING_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {TRAINING_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total fee (₹)" htmlFor="total_fee" error={errors.total_fee}>
            <Input
              id="total_fee"
              name="total_fee"
              inputMode="decimal"
              placeholder="5000"
              defaultValue={defaults.total_fee}
              className="h-11 text-base md:text-sm"
            />
          </Field>
          <Field
            label="Assigned staff"
            htmlFor="assigned_staff_id"
            error={errors.assigned_staff_id}
          >
            <select
              id="assigned_staff_id"
              name="assigned_staff_id"
              defaultValue={defaults.assigned_staff_id}
              className={controlClass}
            >
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes" htmlFor="notes" error={errors.notes}>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={defaults.notes}
            className="min-h-24 text-base md:text-sm"
          />
        </Field>
      </section>

      <div className="sticky bottom-16 z-20 -mx-4 flex gap-2 border-t bg-background/95 p-4 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 lg:bottom-0">
        <Button variant="outline" asChild className="h-11 flex-1 md:h-9 md:flex-none">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButton pendingText="Saving…" className="flex-1 md:w-auto md:flex-none">
          {applicantId ? "Save changes" : "Create applicant"}
        </SubmitButton>
      </div>
    </form>
  );
}
