import { SchoolLogo } from "@/components/layout/school-logo";
import { env } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="page-enter flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <SchoolLogo className="size-16" />
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
