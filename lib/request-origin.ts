import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env";
import { visitorOrigin } from "@/lib/visitor-origin";

/** The address the visitor used, so Razorpay sends them back to the same host or tunnel. */
export async function publicOrigin() {
  return visitorOrigin(await headers()) ?? env.appUrl;
}
