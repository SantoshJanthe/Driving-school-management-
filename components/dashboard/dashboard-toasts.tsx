"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { PERMISSION_LABELS, type Permission } from "@/lib/auth/permissions";

/**
 * Surfaces one-shot messages passed through the URL by server-side guards
 * (`?denied=`) and the password reset flow (`?password=updated`), then strips
 * them from the address bar.
 */
export function DashboardToasts() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const denied = params.get("denied");
  const password = params.get("password");

  useEffect(() => {
    if (!denied && !password) return;

    if (denied) {
      const label =
        denied === "admin"
          ? "That page is for administrators only."
          : `You don't have permission for that page (${
              PERMISSION_LABELS[denied as Permission]?.toLowerCase() ?? denied
            }).`;
      toast.error(label);
    }
    if (password === "updated") {
      toast.success("Your password has been updated.");
    }
    router.replace(pathname);
  }, [denied, password, pathname, router]);

  return null;
}
