"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry wiring arrives in a later milestone; keep the digest visible for support.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Try again, and contact the school admin if it keeps happening.
        {error.digest ? (
          <>
            {" "}
            Reference: <code className="font-mono">{error.digest}</code>
          </>
        ) : null}
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
