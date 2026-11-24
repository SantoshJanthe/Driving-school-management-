import { stat } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InstallAppButton } from "@/components/marketing/install-app-button";
import { PublicShell } from "@/components/marketing/public-shell";
import { Button } from "@/components/ui/button";
import { APK_FILE } from "@/lib/subscription/config";
import { requestForToken } from "@/lib/subscription/requests";

export const metadata: Metadata = { title: "Download the app", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

async function apkSize() {
  try {
    const info = await stat(path.join(process.cwd(), APK_FILE));
    return info.isFile() ? info.size : null;
  } catch {
    return null;
  }
}

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const request = await requestForToken(token);
  if (!request) redirect("/#subscribe");
  if (request.status !== "verified") redirect(`/subscribe/status?token=${token}`);

  const size = await apkSize();

  return (
    <PublicShell>
      <p className="text-xs font-medium tracking-[0.18em] text-[#8a7355] uppercase">
        Payment verified
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
        Download the app for {request.school_name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Install it on each phone and laptop the office uses. Everyone signs in with the email and
        password the school admin gives them.
      </p>

      <div className="mt-8 grid gap-6">
        <section className="grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-5">
          <h2 className="text-lg font-medium">Android phone</h2>
          {size ? (
            <>
              <Button asChild className="h-11 w-fit">
                <a href={`/api/download/apk?token=${token}`} download>
                  Download APK ({(size / 1024 / 1024).toFixed(1)} MB)
                </a>
              </Button>
              <p className="text-sm text-muted-foreground">
                Open the file on the phone. If Android asks, allow installs from your browser, then
                tap Install.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              The Android file is being prepared. Use the install option below on the phone for now.
            </p>
          )}
        </section>

        <section className="grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-5">
          <h2 className="text-lg font-medium">Laptop, iPhone, or any browser</h2>
          <InstallAppButton />
          <Link href="/dashboard" className="w-fit text-sm underline underline-offset-4">
            Open the app in this browser
          </Link>
        </section>
      </div>
    </PublicShell>
  );
}
