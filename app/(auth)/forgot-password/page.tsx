import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Forgot password" };

const ERROR_MESSAGES: Record<string, string> = {
  link_invalid: "That reset link is invalid or has expired. Request a new one below.",
};

type SearchParams = Promise<{ error?: string }>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we will send you a link to choose a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm initialError={error ? ERROR_MESSAGES[error] : undefined} />
      </CardContent>
    </Card>
  );
}
