import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import nosecone from "nosecone";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";
import { noseconeOptions } from "@/lib/security/nosecone";
import { visitorUrl } from "@/lib/visitor-origin";

/**
 * Routes reachable without a session. `/` is the public school page.
 * `matches()` treats a path as a prefix only when it is followed by `/`,
 * so listing `/` does not make every route public.
 */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/subscribe",
  "/download",
  "/api/download",
  "/api/subscription",
  "/api/razorpay/webhook",
  "/api/branding",
  "/manifest.webmanifest",
  "/sw.js",
];

/** Signed-in users are bounced away from these to the dashboard. */
const AUTH_ONLY_PATHS = ["/login", "/forgot-password"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function withSecurity(response: NextResponse, security: Headers) {
  security.forEach((value, key) => response.headers.set(key, value));
  return response;
}

/**
 * Refreshes the Supabase session cookie on every request and applies the
 * redirect rules:
 *   - no session + protected route  -> /login?next=<path>
 *   - session + /login or /forgot-password -> /dashboard
 *   - signed-in visitor on / -> /dashboard
 *   - anonymous visitor on / stays on the public school page
 * Deactivated profiles are handled in the (app) layout, which can query the DB.
 */
export async function updateSession(request: NextRequest) {
  const security = nosecone(noseconeOptions());
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  security.forEach((value, key) => requestHeaders.set(key, value));
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth; getSession() would trust
  // the cookie blindly. Do not put anything between createServerClient and this.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (user && pathname !== "/login/mfa") {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
      return withSecurity(
        NextResponse.redirect(visitorUrl(request.headers, "/login/mfa", request.nextUrl.origin)),
        security,
      );
    }
  }

  if (pathname === "/" && user) {
    return withSecurity(
      NextResponse.redirect(visitorUrl(request.headers, "/dashboard", request.nextUrl.origin)),
      security,
    );
  }

  if (!user && !matches(pathname, PUBLIC_PATHS)) {
    const login = visitorUrl(request.headers, "/login", request.nextUrl.origin);
    if (pathname !== "/dashboard") login.searchParams.set("next", `${pathname}${search}`);
    return withSecurity(NextResponse.redirect(login), security);
  }

  if (user && pathname !== "/login/mfa" && matches(pathname, AUTH_ONLY_PATHS)) {
    return withSecurity(
      NextResponse.redirect(visitorUrl(request.headers, "/dashboard", request.nextUrl.origin)),
      security,
    );
  }

  return withSecurity(response, security);
}
