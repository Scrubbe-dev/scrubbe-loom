// import { auth } from '@/lib/auth';
import { DashboardHeader } from '@/components/header';
import { DashboardShell } from '@/components/shell';
import { SocketProvider } from '@/lib/socket-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <SocketProvider>
      <DashboardShell>
      <DashboardHeader
            heading="Security Dashboard"
            text="Overview of your security posture"
          />
      <div className="flex min-h-screen">
        <main className="flex-1 p-8 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      </DashboardShell>
    </SocketProvider>
  );
}