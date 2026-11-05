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
    <div className="flex min-h-dvh flex-col">
      <GlobalHeader schoolName={schoolName} />
      <div className="flex min-h-0 flex-1">
        <Sidebar schoolName={schoolName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PageTitleBar />
          <main className="page-enter mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
