import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { CONSOLE_COOKIE } from "@/lib/auth/console";
import { denySession } from "@/lib/auth/session-gate";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";
import { visitorOrigin } from "@/lib/visitor-origin";

/**
 * Landing point for links in Supabase Auth emails (password recovery, staff
 * invites). Exchanges the one-time code for a session cookie, then sends the
 * user on to `next` (defaults to /reset-password for recovery/invite flows).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = visitorOrigin(request.headers) ?? request.nextUrl.origin;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), "/reset-password");

  const supabase = await createClient();
  let failed = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = !!error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failed = !!error;
  } else {
    failed = true;
  }

  if (failed) {
    // A provider that refuses or is cancelled sends back `error` and no code;
    // that belongs on the sign-in page, not on password recovery.
    if (searchParams.has("error") || searchParams.has("error_description")) {
      return NextResponse.redirect(`${origin}/login?error=google_failed`);
    }
    return NextResponse.redirect(`${origin}/forgot-password?error=link_invalid`);
  }

  // A Google account is only a second key to an account the school already
  // created. Without a profile the session is thrown away here, so OAuth can
  // never become a self-service sign-up.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const denial = await denySession(supabase, user?.email);
  if (denial) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=${denial}`);
  }

  const jar = await cookies();
  jar.set(CONSOLE_COOKIE, "school", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(`${origin}${next}`);
}
