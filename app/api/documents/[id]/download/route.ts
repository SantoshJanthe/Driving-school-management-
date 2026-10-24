import { openDocumentFile, sanitizeFileName } from "@/lib/documents/files";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * View or download a private document. The row is loaded as the signed-in
 * user, so RLS decides access, and every successful open is written to the
 * activity log.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.redirect(new URL("/login", request.url));
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, applicant_id, file_name, mime_type, storage_path, is_archived")
    .eq("id", id)
    .maybeSingle();
  if (!document) return new Response("Document not found", { status: 404 });

  const opened = await openDocumentFile(supabase, document.storage_path);
  if (!opened) return new Response("File is missing", { status: 404 });

  await supabase.rpc("log_event", {
    p_action: "document_downloaded",
    p_entity_type: "documents",
    p_entity_id: document.id,
    p_applicant_id: document.applicant_id,
    p_details: { file_name: document.file_name },
  });

  const attachment = new URL(request.url).searchParams.get("attachment") === "1";
  const filename = sanitizeFileName(document.file_name);
  if (opened.kind === "redirect") {
    return Response.redirect(opened.url);
  }

  return new Response(new Uint8Array(opened.bytes), {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Disposition": `${attachment ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
