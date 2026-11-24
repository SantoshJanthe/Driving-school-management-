"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-runs the server page on an interval so a verified payment opens the download by itself. */
export function StatusRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [router, seconds]);
  return null;
}
