import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Runs as the signed-in user (anon key + session cookie), so every query is
 * filtered by Row Level Security. The end user's IP / user agent are forwarded
 * as custom headers so the database triggers attribute activity correctly
 * instead of logging the hosting platform's address.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const forwardedFor = headerStore.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "";
  const userAgent = headerStore.get("user-agent") ?? "";

  const globalHeaders: Record<string, string> = {};
  if (clientIp) globalHeaders["x-client-ip"] = clientIp;
  if (userAgent) globalHeaders["x-client-user-agent"] = userAgent;

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: globalHeaders },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there. The
          // middleware refreshes the session cookie, so this is safe to ignore.
        }
      },
    },
  });
}
