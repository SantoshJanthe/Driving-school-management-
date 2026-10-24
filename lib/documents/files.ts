import "server-only";

import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const MIME_SIGNATURE: Record<string, number[] | "webp"> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": "webp",
};

const MIME_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export function maxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? "10");
  const safe = Number.isFinite(mb) && mb > 0 && mb <= 25 ? mb : 10;
  return safe * 1024 * 1024;
}

export function bucketName() {
  return process.env.DOCUMENTS_BUCKET?.trim() || "applicant-documents";
}

export function sanitizeFileName(original: string) {
  const base = (original.split(/[/\\]/).pop() ?? "file").trim();
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 100);
  return cleaned || "file";
}

export function matchesDeclaredType(fileName: string, mime: string, bytes: Uint8Array) {
  const extensions = MIME_EXTENSIONS[mime];
  const signature = MIME_SIGNATURE[mime];
  if (!extensions || !signature) return false;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!extensions.includes(ext)) return false;
  if (bytes.length < 12) return false;
  if (signature === "webp") {
    const riff = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF";
    const webp = String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    return riff && webp;
  }
  return signature.every((byte, index) => bytes[index] === byte);
}

const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}-[A-Za-z0-9._-]{1,120}$/i;

function localRoot() {
  return path.resolve(process.cwd(), "var", "applicant-documents");
}

function localPath(storagePath: string) {
  if (!PATH_PATTERN.test(storagePath) || storagePath.includes("..")) {
    throw new Error("Invalid storage path");
  }
  const full = path.resolve(localRoot(), storagePath);
  const root = localRoot();
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage path");
  return full;
}

async function saveLocal(storagePath: string, bytes: Uint8Array) {
  const full = localPath(storagePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function readLocalDocument(storagePath: string) {
  try {
    return await readFile(localPath(storagePath));
  } catch {
    return null;
  }
}

async function removeLocal(storagePath: string) {
  try {
    await rm(localPath(storagePath), { force: true });
  } catch {
    // Already gone.
  }
}

function isStorageOffline(error: unknown) {
  const status =
    (error as { status?: number; statusCode?: number }).status ??
    (error as { statusCode?: number }).statusCode;
  if (status === 404 || (typeof status === "number" && status >= 500)) return true;
  const message =
    error instanceof Error ? error.message : String((error as { message?: string }).message ?? "");
  return /fetch failed|ECONNREFUSED|ENOTFOUND|network|socket|no route|Unexpected token/i.test(
    message,
  );
}

type Client = SupabaseClient<Database>;

/** Stores the bytes in Supabase Storage, or on local disk when Storage is not running. */
export async function storeDocumentFile(
  supabase: Client,
  storagePath: string,
  bytes: Uint8Array,
  mime: string,
) {
  try {
    const { error } = await supabase.storage.from(bucketName()).upload(storagePath, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (!error) return;
    if (!isStorageOffline(error)) throw new Error(error.message);
  } catch (error) {
    if (!isStorageOffline(error)) {
      throw error instanceof Error ? error : new Error("Could not store the file.");
    }
  }
  await saveLocal(storagePath, bytes);
}

export async function removeDocumentFile(supabase: Client, storagePath: string) {
  await removeLocal(storagePath);
  try {
    await supabase.storage.from(bucketName()).remove([storagePath]);
  } catch {
    // Storage is optional in local development.
  }
}

export async function openDocumentFile(
  supabase: Client,
  storagePath: string,
): Promise<{ kind: "bytes"; bytes: Buffer } | { kind: "redirect"; url: string } | null> {
  const local = await readLocalDocument(storagePath);
  if (local) return { kind: "bytes", bytes: local };
  try {
    const { data, error } = await supabase.storage
      .from(bucketName())
      .createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) return null;
    return { kind: "redirect", url: data.signedUrl };
  } catch {
    return null;
  }
}
