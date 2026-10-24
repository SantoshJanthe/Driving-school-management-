import { MobileNav } from "@/components/layout/mobile-nav";
import { PageTitleBar, GlobalHeader } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({
  schoolName,
  children,
}: {
  schoolName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <GlobalHeader schoolName={schoolName} />
      <div className="flex min-h-0 flex-1">
        <Sidebar schoolName={schoolName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PageTitleBar />
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 md:p-6 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
