/**
 * Error reporting. Stays off unless SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN is set.
 * No DSN is configured in this environment, so nothing is sent.
 */
export function reportError(error: unknown) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;
  console.error(error);
}

export function monitoringEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
}
