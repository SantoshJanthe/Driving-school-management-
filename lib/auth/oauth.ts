import "server-only";

/**
 * Google sign-in is off until the Supabase project has the provider connected
 * and AUTH_GOOGLE_ENABLED is set. Showing the button without the provider only
 * produces a dead end, so it stays hidden like the other optional connectors.
 */
export function googleSignInEnabled() {
  return (process.env.AUTH_GOOGLE_ENABLED ?? "").trim().toLowerCase() === "true";
}
