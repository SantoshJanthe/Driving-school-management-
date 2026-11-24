import { NextResponse, type NextRequest } from "next/server";

import { CONSOLE_COOKIE } from "@/lib/auth/console";
import { createClient } from "@/lib/supabase/server";
import { visitorOrigin } from "@/lib/visitor-origin";

const REASONS = new Set(["deactivated", "no_profile", "expired", "school_suspended"]);

/**
 * Forced sign-out used by server components, which cannot clear cookies
 * themselves (e.g. the app layout discovering a deactivated profile). The
 * user-initiated logout goes through the `logout` Server Action instead.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const reason = request.nextUrl.searchParams.get("reason");
  const url = new URL("/login", visitorOrigin(request.headers) ?? request.nextUrl.origin);
  if (reason && REASONS.has(reason)) url.searchParams.set("error", reason);
  const response = NextResponse.redirect(url);
  response.cookies.set(CONSOLE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
