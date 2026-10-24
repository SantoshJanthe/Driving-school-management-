import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/** Routes reachable without a session. Everything else requires one. */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/auth/callback"];

/** Signed-in users are bounced away from these to the dashboard. */
const AUTH_ONLY_PATHS = ["/login", "/forgot-password"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session cookie on every request and applies the
 * redirect rules:
 *   - no session + protected route  -> /login?next=<path>
 *   - session + /login or /forgot-password -> /dashboard
 *   - /  -> /dashboard (or /login)
 * Deactivated profiles are handled in the (app) layout, which can query the DB.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
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

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && !matches(pathname, PUBLIC_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/dashboard") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && matches(pathname, AUTH_ONLY_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
