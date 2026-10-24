import type { DocumentType } from "@/lib/documents/constants";
import { createClient } from "@/lib/supabase/server";

export type DocumentRow = {
  id: string;
  document_type: DocumentType;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  is_archived: boolean;
  applicant_id: string;
  applicant_name: string | null;
  application_number: string | null;
  uploaded_by_name: string | null;
};

type ApplicantJoin = { id: string; full_name: string; application_number: string | null } | null;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listDocuments(filters: {
  applicantId?: string;
  q?: string;
  type?: DocumentType;
  from?: string;
  to?: string;
  includeArchived?: boolean;
}): Promise<DocumentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select(
      "id, document_type, file_name, file_size, mime_type, uploaded_at, is_archived, applicant_id, uploaded_by, applicant:applicants(id, full_name, application_number)",
    )
    .order("uploaded_at", { ascending: false })
    .limit(200);

  if (filters.applicantId) query = query.eq("applicant_id", filters.applicantId);
  if (filters.type) query = query.eq("document_type", filters.type);
  if (!filters.includeArchived) query = query.eq("is_archived", false);
  if (filters.from) query = query.gte("uploaded_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) query = query.lte("uploaded_at", `${filters.to}T23:59:59.999Z`);

  const [{ data, error }, profiles] = await Promise.all([
    query,
    supabase.from("profiles").select("id, full_name"),
  ]);
  if (error) throw new Error(error.message);

  const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.full_name]));
  const needle = filters.q?.trim().toLowerCase() ?? "";

  return (data ?? [])
    .map((row) => {
      const applicant = one(row.applicant as ApplicantJoin | ApplicantJoin[]);
      return {
        id: row.id,
        document_type: row.document_type,
        file_name: row.file_name,
        file_size: Number(row.file_size),
        mime_type: row.mime_type,
        uploaded_at: row.uploaded_at,
        is_archived: row.is_archived,
        applicant_id: row.applicant_id,
        applicant_name: applicant?.full_name ?? null,
        application_number: applicant?.application_number ?? null,
        uploaded_by_name: row.uploaded_by ? (names.get(row.uploaded_by) ?? null) : null,
      };
    })
    .filter((row) => {
      if (!needle) return true;
      return [row.file_name, row.applicant_name, row.application_number]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
}
