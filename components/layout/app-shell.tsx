import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({
  schoolName,
  children,
}: {
  schoolName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-muted/30">
      <Sidebar schoolName={schoolName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar schoolName={schoolName} />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 md:p-6 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
