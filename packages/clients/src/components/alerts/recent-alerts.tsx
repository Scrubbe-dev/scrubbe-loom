'use client';

import { useLiveAlerts } from "@/lib/hooks/use-live-alerts";
import { AlertCard } from "@/components/alerts/alert-card";

export function RecentAlerts() {
  const { alerts, acknowledgeAlert } = useLiveAlerts();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent Alerts</h2>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => (
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