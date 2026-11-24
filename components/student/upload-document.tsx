"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadStudentDocument, type UploadState } from "@/lib/actions/documents";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documents/constants";

const initial: UploadState = {};

export function StudentUpload() {
  const [state, action] = useActionState(uploadStudentDocument, initial);
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-dashed border-black/15 p-4">
      <h3 className="text-sm font-medium">Upload a document</h3>
      <p className="text-sm text-muted-foreground">PDF, JPG, PNG, or WEBP. Up to 10 MB. It is added only to your record.</p>
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="student-doc-type">Type</Label>
          <select
            id="student-doc-type"
            name="document_type"
            className="border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm"
            defaultValue="id_proof"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="student-doc-file">File</Label>
          <Input id="student-doc-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
        </div>
        <SubmitButton pendingText="Uploading…" className="sm:w-auto">
          Upload
        </SubmitButton>
      </div>
    </form>
  );
}
