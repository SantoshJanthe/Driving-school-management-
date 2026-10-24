import type { Metadata } from "next";
import Link from "next/link";

import { DocumentTable } from "@/components/documents/document-table";
import { UploadForm } from "@/components/documents/upload-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requirePermission } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/permissions";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, isDocumentType } from "@/lib/documents/constants";
import { listDocuments } from "@/lib/queries/documents";

export const metadata: Metadata = { title: "Documents" };

const NOTICES: Record<string, string> = {
  uploaded: "Document uploaded.",
  archived: "Document archived.",
  deleted: "Document deleted.",
  denied: "You don't have permission for that action.",
};

export default async function ApplicantDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; type?: string; archived?: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const { id } = await params;
  const query = await searchParams;
  const type = isDocumentType(query.type ?? "") ? query.type : undefined;
  const includeArchived = query.archived === "1";
  const rows = await listDocuments({
    applicantId: id,
    type: type && isDocumentType(type) ? type : undefined,
    includeArchived,
  });

  return (
    <div className="grid gap-4">
      {query.notice && NOTICES[query.notice] ? (
        <Alert>
          <AlertDescription>{NOTICES[query.notice]}</AlertDescription>
        </Alert>
      ) : null}
      <UploadForm applicantId={id} />
      <form className="flex flex-wrap items-center gap-3 text-sm" method="get">
        <label className="flex items-center gap-2">
          Type
          <select
            name="type"
            defaultValue={type ?? ""}
            className="h-9 rounded-lg border border-input bg-background px-2"
          >
            <option value="">All</option>
            {DOCUMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="archived" value="1" defaultChecked={includeArchived} />
          Show archived
        </label>
        <button type="submit" className="text-sm font-medium underline-offset-4 hover:underline">
          Apply
        </button>
        {type || includeArchived ? (
          <Link
            href={`/applicants/${id}/documents`}
            className="text-muted-foreground hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>
      <DocumentTable rows={rows} isAdmin={isAdmin(profile)} />
    </div>
  );
}
