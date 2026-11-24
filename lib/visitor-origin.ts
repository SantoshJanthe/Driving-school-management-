/**
 * The host the visitor actually typed, including a Cloudflare tunnel.
 * Next.js otherwise builds redirects from the origin Host (localhost:3000),
 * which sends the browser to a machine that is not running the app.
 */
export function visitorOrigin(headerStore: Headers): string | null {
  const forwardedHost = headerStore.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerStore.get("host")?.split(",")[0]?.trim();
  if (!host) return null;
  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export function visitorUrl(headerStore: Headers, path: string, originFallback: string): URL {
  return new URL(path, visitorOrigin(headerStore) ?? originFallback);
}
