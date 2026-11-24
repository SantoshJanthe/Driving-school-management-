import type { Metadata } from "next";
import Link from "next/link";

import { AddDocumentDialog } from "@/components/documents/add-document-dialog";
import { DocumentTable } from "@/components/documents/document-table";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requirePermission } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/permissions";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, isDocumentType } from "@/lib/documents/constants";
import { listApplicantsForUpload, listDocuments } from "@/lib/queries/documents";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    from?: string;
    to?: string;
    archived?: string;
    notice?: string;
  }>;
}) {
  const profile = await requirePermission("view_applicants");
  const query = await searchParams;
  const type = isDocumentType(query.type ?? "") ? query.type : undefined;
  const [rows, applicants] = await Promise.all([
    listDocuments({
      q: query.q,
      type: type && isDocumentType(type) ? type : undefined,
      from: query.from,
      to: query.to,
      includeArchived: query.archived === "1",
    }),
    listApplicantsForUpload(),
  ]);

  return (
    <div className="grid gap-5">
      {query.notice === "uploaded" ? (
        <Alert>
          <AlertDescription>Document added.</AlertDescription>
        </Alert>
      ) : null}
      <PageHeader
        title="Documents"
        description="Add a file for an applicant, or search what has already been uploaded."
        actions={<AddDocumentDialog applicants={applicants} />}
      />
      <form method="get" className="grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-5">
        <Input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Applicant, application no. or file name"
          aria-label="Search documents"
          className="h-11 xl:col-span-2"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          aria-label="Document type"
          className="h-11 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {DOCUMENT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
        <Input
          name="from"
          type="date"
          defaultValue={query.from ?? ""}
          aria-label="Uploaded from"
          className="h-11"
        />
        <Input
          name="to"
          type="date"
          defaultValue={query.to ?? ""}
          aria-label="Uploaded to"
          className="h-11"
        />
        <label className="flex items-center gap-2 text-sm xl:col-span-2">
          <input
            type="checkbox"
            name="archived"
            value="1"
            defaultChecked={query.archived === "1"}
          />
          Include archived
        </label>
        <div className="flex gap-2">
          <Button type="submit" className="h-11">
            Search
          </Button>
          <Button variant="outline" asChild className="h-11">
            <Link href="/documents">Clear</Link>
          </Button>
        </div>
      </form>
      <DocumentTable rows={rows} showApplicant isAdmin={isAdmin(profile)} />
    </div>
  );
}
