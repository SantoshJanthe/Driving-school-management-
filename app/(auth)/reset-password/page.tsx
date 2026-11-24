import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The recovery link lands on /auth/callback which exchanges the code for a
  // session; by the time we are here the user must be signed in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Choose a new password</CardTitle>
        <CardDescription>
          {user ? (
            <>
              Setting a new password for <span className="font-medium">{user.email}</span>.
            </>
          ) : (
            "This link is no longer valid."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="grid gap-4">
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                The reset link has expired or was already used. Request a new one to continue.
              </AlertDescription>
            </Alert>
            <Button asChild className="h-11 w-full">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
