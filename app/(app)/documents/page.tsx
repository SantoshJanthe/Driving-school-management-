import type { Metadata } from "next";
import Link from "next/link";

import { DocumentTable } from "@/components/documents/document-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requirePermission } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/permissions";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, isDocumentType } from "@/lib/documents/constants";
import { listDocuments } from "@/lib/queries/documents";

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
  }>;
}) {
  const profile = await requirePermission("view_applicants");
  const query = await searchParams;
  const type = isDocumentType(query.type ?? "") ? query.type : undefined;
  const rows = await listDocuments({
    q: query.q,
    type: type && isDocumentType(type) ? type : undefined,
    from: query.from,
    to: query.to,
    includeArchived: query.archived === "1",
  });

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Documents"
        description="Search private applicant files. Upload happens on the applicant’s Documents tab."
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
