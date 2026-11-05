import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@/lib/supabase/server";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(request: Request) {
  const school = new URL(request.url).searchParams.get("school");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("school_logo_path", {
    p_school: school || null,
  });
  if (error || typeof data !== "string" || !data.startsWith("var/school-logos/")) {
    return new Response(null, { status: 404 });
  }
  const file = path.resolve(process.cwd(), data);
  const root = path.resolve(process.cwd(), "var/school-logos");
  if (!file.startsWith(`${root}${path.sep}`)) return new Response(null, { status: 404 });
  const ext = path.extname(file).slice(1);
  const type = TYPES[ext];
  if (!type) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(file);
    return new Response(bytes, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
