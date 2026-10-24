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
      <CardContent>
        <LoginForm
          next={safeNext !== "/dashboard" ? safeNext : undefined}
          initialError={error ? ERROR_MESSAGES[error] : undefined}
        />
      </CardContent>
    </Card>
  );
}
