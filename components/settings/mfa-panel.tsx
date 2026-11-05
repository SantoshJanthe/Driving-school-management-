"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Enrolled = { id: string; qr: string; secret: string };

export function MfaPanel() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<Enrolled | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.mfa.listFactors().then(({ data }) => {
      setFactorId(data?.totp[0]?.id ?? null);
    });
  }, []);

  async function start() {
    setError(null);
    const supabase = createClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator",
      issuer: "MOTOR DRIVING SCHOOL SOFTWARE",
    });
    if (enrollError || !data || data.type !== "totp") {
      setError(enrollError?.message ?? "Authenticator setup is not available on this sign-in service.");
      return;
    }
    setEnrolled({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirm() {
    if (!enrolled) return;
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrolled.id,
      code,
    });
    if (verifyError) {
      setError("That code was not accepted.");
      return;
    }
    setFactorId(enrolled.id);
    setEnrolled(null);
    setCode("");
    setMessage("Authenticator is on. The next sign-in will ask for a code.");
  }

  async function turnOff() {
    if (!factorId) return;
    setError(null);
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    setFactorId(null);
    setMessage("Authenticator is off.");
  }

  return (
    <section className="grid max-w-md gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-4 md:p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase">Authenticator</h2>
      <p className="text-sm text-muted-foreground">
        Optional for an admin. Uses the sign-in service’s own one-time codes. No extra vendor key.
      </p>
      {message ? (
        <Alert role="status">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {factorId && !enrolled ? (
        <Button type="button" variant="outline" className="h-11 w-fit" onClick={() => void turnOff()}>
          Turn off authenticator
        </Button>
      ) : null}
      {!factorId && !enrolled ? (
        <Button type="button" className="h-11 w-fit" onClick={() => void start()}>
          Set up authenticator
        </Button>
      ) : null}
      {enrolled ? (
        <div className="grid gap-3">
          {/* The auth service returns an SVG of the setup key. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolled.qr} alt="" className="h-24 w-full rounded-lg border bg-white object-contain" />
          <p className="font-mono text-sm break-all">{enrolled.secret}</p>
          <div className="grid gap-1.5">
            <Label htmlFor="mfa-code">Code from the app</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="h-11"
            />
          </div>
          <Button type="button" className="h-11 w-fit" onClick={() => void confirm()}>
            Confirm code
          </Button>
        </div>
      ) : null}
    </section>
  );
}
