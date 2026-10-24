import Link from "next/link";

import { archiveDocument, deleteDocument } from "@/lib/actions/documents";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/documents/constants";
import { formatDateTime, formatFileSize } from "@/lib/format";
import type { DocumentRow } from "@/lib/queries/documents";
import { Button } from "@/components/ui/button";

export function DocumentTable({
  rows,
  showApplicant,
  isAdmin,
}: {
  rows: DocumentRow[];
  showApplicant?: boolean;
  isAdmin?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No documents yet.
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-2 rounded-xl border p-4 text-sm">
            <DocumentBody row={row} showApplicant={showApplicant} />
            <DocumentActions row={row} isAdmin={isAdmin} />
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              {showApplicant ? <th className="px-4 py-3 font-medium">Applicant</th> : null}
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">By</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t align-top">
                {showApplicant ? (
                  <td className="px-4 py-3">
                    <Link
                      href={`/applicants/${row.applicant_id}/documents`}
                      className="font-medium hover:underline"
                    >
                      {row.applicant_name ?? "Applicant"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {row.application_number ?? "—"}
                    </div>
                  </td>
                ) : null}
                <td className="px-4 py-3">{DOCUMENT_TYPE_LABELS[row.document_type]}</td>
                <td className="px-4 py-3 font-medium">
                  {row.file_name}
                  {row.is_archived ? (
                    <span className="font-normal text-muted-foreground"> · archived</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatDateTime(row.uploaded_at)}
                </td>
                <td className="px-4 py-3">{row.uploaded_by_name ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatFileSize(row.file_size)}</td>
                <td className="px-4 py-3">
                  <DocumentActions row={row} isAdmin={isAdmin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DocumentBody({ row, showApplicant }: { row: DocumentRow; showApplicant?: boolean }) {
  return (
    <div className="grid gap-1">
      {showApplicant ? (
        <Link
          href={`/applicants/${row.applicant_id}/documents`}
          className="font-medium hover:underline"
        >
          {row.applicant_name ?? "Applicant"}
        </Link>
      ) : null}
      <p className="font-medium">
        {row.file_name}
        {row.is_archived ? (
          <span className="font-normal text-muted-foreground"> · archived</span>
        ) : null}
      </p>
      <p className="text-xs text-muted-foreground">
        {DOCUMENT_TYPE_LABELS[row.document_type as DocumentType]} · {formatFileSize(row.file_size)}{" "}
        · {formatDateTime(row.uploaded_at)}
        {row.uploaded_by_name ? ` · ${row.uploaded_by_name}` : ""}
      </p>
    </div>
  );
}

function DocumentActions({ row, isAdmin }: { row: DocumentRow; isAdmin?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/documents/${row.id}/download`} target="_blank" rel="noreferrer">
          View
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/documents/${row.id}/download?attachment=1`}>Download</a>
      </Button>
      {isAdmin && !row.is_archived ? (
        <form action={archiveDocument}>
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="applicant_id" value={row.applicant_id} />
          <Button type="submit" variant="ghost" size="sm">
            Archive
          </Button>
        </form>
      ) : null}
      {isAdmin ? (
        <form action={deleteDocument}>
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="applicant_id" value={row.applicant_id} />
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Delete
          </Button>
        </form>
      ) : null}
    </div>
  );
}
