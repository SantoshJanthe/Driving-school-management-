import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";

/**
 * Landing point for links in Supabase Auth emails (password recovery, staff
 * invites). Exchanges the one-time code for a session cookie, then sends the
 * user on to `next` (defaults to /reset-password for recovery/invite flows).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
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
    return NextResponse.redirect(`${origin}/forgot-password?error=link_invalid`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
