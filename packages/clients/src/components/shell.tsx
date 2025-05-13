import { Sidebar } from "@/components/sidebar";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4 pt-8 md:p-8">
        {children}
      </main>
    </div>
  );
}