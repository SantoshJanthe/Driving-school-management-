import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env";

/** The address the visitor used, so Razorpay sends them back to the same host or tunnel. */
export async function publicOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return env.appUrl;
}
