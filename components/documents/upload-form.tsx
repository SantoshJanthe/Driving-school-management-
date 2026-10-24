"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { uploadDocument, type UploadState } from "@/lib/actions/documents";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documents/constants";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const initial: UploadState = {};

export function UploadForm({ applicantId }: { applicantId: string }) {
  const [state, action] = useActionState(uploadDocument, initial);
  const [clientError, setClientError] = useState<string>();

  return (
    <form
      action={action}
      className="grid gap-4 rounded-xl border p-4"
      onSubmit={(event) => {
        const input = event.currentTarget.elements.namedItem("file");
        const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
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
      <div>
        <h2 className="font-semibold">Upload document</h2>
        <p className="text-sm text-muted-foreground">PDF, JPG, PNG, or WEBP. Maximum 10 MB.</p>
      </div>
      {clientError || state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{clientError || state.error}</AlertDescription>
        </Alert>
      ) : null}
      <input type="hidden" name="applicant_id" value={applicantId} />
      <div className="grid gap-4 md:grid-cols-[16rem_1fr_auto] md:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="document_type">Type</Label>
          <select
            id="document_type"
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
          <Label htmlFor="file">File</Label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
            className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
        </div>
        <SubmitButton pendingText="Uploading…" className="md:w-fit">
          Upload
        </SubmitButton>
      </div>
    </form>
  );
}
