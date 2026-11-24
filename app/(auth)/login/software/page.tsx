import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNextPath } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Software admin sign-in" };

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function SoftwareLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next, "/vendor/schools");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Software admin</CardTitle>
        <CardDescription>
          Schools, software access, and subscription payments. School records stay with each school
          admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <LoginForm
          door="software"
          next={safeNext !== "/vendor/schools" ? safeNext : undefined}
          initialError={error === "expired" ? "Your session has expired. Please sign in again." : undefined}
        />
        <p className="text-xs text-muted-foreground">
          Demo software admin <span className="font-mono">admin@sample-dsm.local</span> /{" "}
          <span className="font-mono">Admin@12345</span>
        </p>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          School sign-in
        </Link>
      </CardContent>
    </Card>
  );
}
