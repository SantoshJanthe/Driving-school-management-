"use client";

import { useActionState, useId, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { uploadDocument, type UploadState } from "@/lib/actions/documents";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documents/constants";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const initial: UploadState = {};

export function UploadForm({
  applicantId,
  applicants,
  returnTo,
  bare,
}: {
  applicantId?: string;
  applicants?: { id: string; full_name: string; application_number: string | null }[];
  returnTo?: string;
  bare?: boolean;
}) {
  const [state, action] = useActionState(uploadDocument, initial);
  const [clientError, setClientError] = useState<string>();
  const typeId = useId();
  const fileId = useId();
  const applicantFieldId = useId();

  return (
    <form
      action={action}
      className={bare ? "grid gap-4" : "grid gap-4 rounded-xl border p-4"}
      onSubmit={(event) => {
        const input = event.currentTarget.elements.namedItem("file");
        const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
        const chosenApplicant = event.currentTarget.elements.namedItem("applicant_id");
        const applicantValue =
          chosenApplicant instanceof HTMLInputElement ||
          chosenApplicant instanceof HTMLSelectElement
            ? chosenApplicant.value
            : "";
        if (!applicantValue) {
          event.preventDefault();
          setClientError("Choose an applicant.");
          return;
        }
        if (!file) {
          event.preventDefault();
          setClientError("Choose a file.");
          return;
        }
        if (!ALLOWED.has(file.type)) {
          event.preventDefault();
          setClientError("Use a PDF, JPG, PNG, or WEBP file.");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          event.preventDefault();
          setClientError("File must be 10 MB or smaller.");
          return;
        }
        setClientError(undefined);
      }}
    >
      {bare ? null : (
        <div>
          <h2 className="font-semibold">Upload document</h2>
          <p className="text-sm text-muted-foreground">PDF, JPG, PNG, or WEBP. Maximum 10 MB.</p>
        </div>
      )}
      {clientError || state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{clientError || state.error}</AlertDescription>
        </Alert>
      ) : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
      {applicantId ? <input type="hidden" name="applicant_id" value={applicantId} /> : null}
      <div className="grid gap-4">
        {applicants ? (
          <div className="grid gap-1.5">
            <Label htmlFor={applicantFieldId}>Applicant</Label>
            <select
              id={applicantFieldId}
              name="applicant_id"
              className={selectClass}
              defaultValue=""
              required
            >
              <option value="" disabled>
                Choose an applicant
              </option>
              {applicants.map((applicant) => (
                <option key={applicant.id} value={applicant.id}>
                  {applicant.full_name}
                  {applicant.application_number ? ` · ${applicant.application_number}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div
          className={bare ? "grid gap-4" : "grid gap-4 md:grid-cols-[16rem_1fr_auto] md:items-end"}
        >
          <div className="grid gap-1.5">
            <Label htmlFor={typeId}>Type</Label>
            <select
              id={typeId}
              name="document_type"
              className={selectClass}
              defaultValue="application_form"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={fileId}>File</Label>
            <input
              id={fileId}
              name="file"
              type="file"
              required
              accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
              className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>
          <SubmitButton pendingText="Uploading…" className="md:w-fit">
            {bare ? "Add document" : "Upload"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
