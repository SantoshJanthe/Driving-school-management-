"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLicenceChecklist, type ChecklistState } from "@/lib/actions/checklist";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/documents/constants";
import { formatDate } from "@/lib/format";

const initial: ChecklistState = {};

export function LicenceChecklist({
  applicantId,
  llNumber,
  llIssuedOn,
  dlTestDate,
  dlResult,
  missing,
  canEdit,
}: {
  applicantId: string;
  llNumber: string;
  llIssuedOn: string;
  dlTestDate: string;
  dlResult: string;
  missing: DocumentType[];
  canEdit: boolean;
}) {
  const [state, action] = useActionState(saveLicenceChecklist, initial);
  return (
    <section className="grid gap-3 rounded-xl border p-4" aria-labelledby="licence-checklist">
      <h3 id="licence-checklist" className="text-sm font-semibold">
        Licence checklist
      </h3>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert>
          <AlertDescription>Checklist saved.</AlertDescription>
        </Alert>
      ) : null}
      <p className="text-sm">
        Documents still missing:{" "}
        {missing.length === 0
          ? "None"
          : missing.map((type) => DOCUMENT_TYPE_LABELS[type]).join(", ")}
      </p>
      {canEdit ? (
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={applicantId} />
          <div className="grid gap-1.5">
            <Label htmlFor="ll-number">Learner&apos;s licence number</Label>
            <Input id="ll-number" name="ll_number" defaultValue={llNumber} className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ll-date">Learner&apos;s licence date</Label>
            <Input id="ll-date" name="ll_issued_on" type="date" defaultValue={llIssuedOn} className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dl-date">Driving licence test date</Label>
            <Input id="dl-date" name="dl_test_date" type="date" defaultValue={dlTestDate} className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dl-result">Test result</Label>
            <select
              id="dl-result"
              name="dl_result"
              defaultValue={dlResult}
              className="border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm"
            >
              <option value="">Not set</option>
              <option value="pending">Pending</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </select>
          </div>
          <SubmitButton pendingText="Saving…" className="md:w-fit">
            Save checklist
          </SubmitButton>
        </form>
      ) : (
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Learner&apos;s licence</dt>
            <dd>{llNumber || "—"}{llIssuedOn ? ` · ${formatDate(llIssuedOn)}` : ""}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Driving test</dt>
            <dd>
              {dlTestDate ? formatDate(dlTestDate) : "—"}
              {dlResult ? ` · ${dlResult}` : ""}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
