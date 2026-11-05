import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const REASONS = new Set(["deactivated", "no_profile", "expired"]);

/**
 * Forced sign-out used by server components, which cannot clear cookies
 * themselves (e.g. the app layout discovering a deactivated profile). The
 * user-initiated logout goes through the `logout` Server Action instead.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const reason = request.nextUrl.searchParams.get("reason");
  const url = new URL("/login", request.nextUrl.origin);
  if (reason && REASONS.has(reason)) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}
