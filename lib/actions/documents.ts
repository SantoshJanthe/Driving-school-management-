"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDocumentType } from "@/lib/documents/constants";
import {
  matchesDeclaredType,
  maxUploadBytes,
  removeDocumentFile,
  sanitizeFileName,
  storeDocumentFile,
} from "@/lib/documents/files";
import { requireAdmin, requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type UploadState = { error?: string };

function permissionMessage(error: { code?: string; message: string }) {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "You don't have permission for this action.";
  }
  return error.message;
}

export async function uploadDocument(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const profile = await requirePermission("view_applicants");
  const applicantId = String(formData.get("applicant_id") ?? "");
  const typeRaw = String(formData.get("document_type") ?? "other");
  const file = formData.get("file");

  if (!applicantId) return { error: "Choose an applicant." };
  if (!isDocumentType(typeRaw)) return { error: "Choose a document type." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };
  if (file.size > maxUploadBytes()) return { error: "File must be 10 MB or smaller." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const safeName = sanitizeFileName(file.name);
  if (!matchesDeclaredType(safeName, file.type, bytes)) {
    return { error: "Use a PDF, JPG, PNG, or WEBP file. The file contents must match its type." };
  }

  const supabase = await createClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant || applicant.school_id !== profile.school_id) {
    return { error: "That applicant is not in your school." };
  }

  const documentId = crypto.randomUUID();
  const storagePath = `${applicant.school_id}/${applicant.id}/${documentId}-${safeName}`;

  try {
    await storeDocumentFile(supabase, storagePath, bytes, file.type);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not store the file." };
  }

  const { error } = await supabase.from("documents").insert({
    id: documentId,
    school_id: applicant.school_id,
    applicant_id: applicant.id,
    document_type: typeRaw,
    file_name: safeName,
    storage_path: storagePath,
    file_size: file.size,
    mime_type: file.type,
    uploaded_by: profile.id,
  });
  if (error) {
    await removeDocumentFile(supabase, storagePath);
    return { error: permissionMessage(error) };
  }

  revalidatePath(`/applicants/${applicant.id}/documents`);
  revalidatePath("/documents");
  revalidatePath(`/applicants/${applicant.id}/history`);
  const requested = String(formData.get("return_to") ?? "");
  const fallback = `/applicants/${applicant.id}/documents`;
  const safe =
    requested === "/documents" ||
    requested.startsWith("/documents?") ||
    requested.startsWith("/applicants/")
      ? requested.split("?")[0]
      : fallback;
  redirect(`${safe}?notice=uploaded`);
}

export async function archiveDocument(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const applicantId = String(formData.get("applicant_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("documents").update({ is_archived: true }).eq("id", id);
  if (error) redirect(`/applicants/${applicantId}/documents?notice=denied`);
  revalidatePath(`/applicants/${applicantId}/documents`);
  revalidatePath("/documents");
  redirect(`/applicants/${applicantId}/documents?notice=archived`);
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const applicantId = String(formData.get("applicant_id") ?? "");
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!existing) redirect(`/applicants/${applicantId}/documents`);
  await removeDocumentFile(supabase, existing.storage_path);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) redirect(`/applicants/${applicantId}/documents?notice=denied`);
  revalidatePath(`/applicants/${applicantId}/documents`);
  revalidatePath("/documents");
  redirect(`/applicants/${applicantId}/documents?notice=deleted`);
}
