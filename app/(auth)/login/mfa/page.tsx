import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MfaForm } from "@/components/auth/mfa-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Authenticator" };

export default async function MfaPage() {
  const supabase = await createClient();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!assurance) redirect("/login");
  if (assurance.currentLevel === "aal2" || assurance.nextLevel !== "aal2") redirect("/dashboard");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Authenticator</CardTitle>
        <CardDescription>Enter the 6-digit code from the authenticator app.</CardDescription>
      </CardHeader>
      <CardContent>
        <MfaForm />
      </CardContent>
    </Card>
  );
}
