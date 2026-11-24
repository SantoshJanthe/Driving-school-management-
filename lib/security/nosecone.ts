import { defaults } from "@nosecone/next";
import type { Options, Source } from "nosecone";

/**
 * Website security headers from Nosecone
 * (https://github.com/arcjet/arcjet-js/tree/main/nosecone).
 *
 * Defaults follow Helmet. connect-src also allows the Supabase project so the
 * signed-in app can reach Auth and PostgREST.
 */
function extraConnectSrc(): Source[] {
  const extra: Source[] = [];
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabase) {
    try {
      extra.push(new URL(supabase).origin as Source);
    } catch {
      // Ignore a malformed URL; the env check elsewhere will fail loudly.
    }
  }
  if (process.env.NODE_ENV !== "production") {
    extra.push("ws://localhost:*", "http://localhost:*", "http://127.0.0.1:*");
  }
  return extra;
}

export function noseconeOptions(): Options {
  return {
    ...defaults,
    // require-corp blocks the browser from talking to Supabase on another origin.
    crossOriginEmbedderPolicy: false,
    xFrameOptions: { action: "deny" },
    contentSecurityPolicy: {
      directives: {
        ...defaults.contentSecurityPolicy.directives,
        connectSrc: [...defaults.contentSecurityPolicy.directives.connectSrc, ...extraConnectSrc()],
      },
    },
  };
}
