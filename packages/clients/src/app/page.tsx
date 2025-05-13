'use client'
import { redirect } from "next/navigation";
// import { getCurrentUser } from ";@/lib/session"
import { DashboardShell } from "@/components/shell";
import { DashboardHeader } from "@/components/header";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentAlerts } from "@/components/alerts/recent-alerts";
import { AttackMap } from "@/components/charts/attack-map";
import { IncidentOverview } from "@/components/incidents/incident-overview";
import { useCookiesNext } from "cookies-next";

export default function DashboardPage() {
   const { hasCookie,getCookie } = useCookiesNext();

    if (hasCookie("user-auth") === false) {
      redirect("/auth/login");
    }

  // <DashboardShell>
  return (
      <div>
        <DashboardShell>
      <DashboardHeader
        heading="Welcome to Scrubbe Security Dashboard"
        text="Overview of your security posture"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCards />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          {/* <AttackMap data={[]} /> */}
        </div>
        <div className="col-span-3">
          <RecentAlerts />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <IncidentOverview />
      </div>
      </DashboardShell>
     </div>
  );
}