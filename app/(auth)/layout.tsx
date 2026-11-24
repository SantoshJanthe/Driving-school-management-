import { SchoolLogo } from "@/components/layout/school-logo";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function schoolHasLogo() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("public_school");
    return Boolean(data && typeof data === "object" && !Array.isArray(data) && data.has_logo === true);
  } catch {
    return false;
  }
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const hasLogo = await schoolHasLogo();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="page-enter flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/api/branding/logo" alt="" className="size-16 rounded-xl object-cover" />
          ) : (
            <SchoolLogo className="size-16" />
          )}
          <h1 className="text-xl font-semibold tracking-tight">{env.appName}</h1>
        </div>
        {children}
        <p className="text-center text-xs text-muted-foreground">
          Authorised staff only. Access is logged.
        </p>
      </div>
    </main>
  );
}
