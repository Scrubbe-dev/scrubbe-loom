'use client';
import { AlertCard } from '@/components/alerts/alert-card';
import { useLiveAlerts } from '@/lib/hooks/use-live-alerts';
import { useCookiesNext } from 'cookies-next';
import { redirect } from 'next/navigation';

export default function AlertsPage() {
  const { alerts, acknowledgeAlert } = useLiveAlerts();

  const { hasCookie,getCookie } = useCookiesNext();

  if (hasCookie("user-auth") === false) {
    redirect("/auth/login");
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Alerts</h1>
        <div className="text-muted-foreground">
          {alerts.length} active alerts
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert: { id: any; }) => (
          <AlertCard 
            key={alert.id}
            alert={alert}
            onAcknowledge={acknowledgeAlert}
          />
        ))}
      </div>
    </div>
  );
}