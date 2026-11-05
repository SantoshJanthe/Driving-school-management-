import { reportError } from "@/lib/monitoring";

export async function register() {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
}

export async function onRequestError(error: unknown) {
  reportError(error);
}
