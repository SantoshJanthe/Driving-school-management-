import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEACTIVATED_MESSAGE, NO_PROFILE_MESSAGE } from "@/lib/auth/messages";
import { safeNextPath } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  deactivated: DEACTIVATED_MESSAGE,
  no_profile: NO_PROFILE_MESSAGE,
  expired: "Your session has expired. Please sign in again.",
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>Use the email and password issued by your school admin.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <LoginForm
          next={safeNext !== "/dashboard" ? safeNext : undefined}
          initialError={error ? ERROR_MESSAGES[error] : undefined}
        />
        <div className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-xs text-[#1f2328]">
          <p className="font-semibold">Demo accounts</p>
          <p className="mt-1">
            Admin <span className="font-mono">admin@sample-dsm.local</span> /{" "}
            <span className="font-mono">Admin@12345</span>
          </p>
          <p>
            Staff <span className="font-mono">staff@sample-dsm.local</span> /{" "}
            <span className="font-mono">Staff@12345</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
