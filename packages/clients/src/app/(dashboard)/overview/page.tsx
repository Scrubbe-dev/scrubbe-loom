'use client';
import { useEffect, useState } from 'react';
import { LineChart, BarChart } from '@/components/charts/line-chart';
import { RealTimeFeed } from '@/components/feed/real-time-feed';
import { useSocket } from '@/lib/socket-context';
import { MetricCard } from '@/components/ui/metric-card';
import apiClient from '@/lib/axios';
import { useCookiesNext } from 'cookies-next';
import { redirect } from 'next/navigation';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const { socket } = useSocket();

  
  const { hasCookie,getCookie } = useCookiesNext();

  if (hasCookie("user-auth") === false) {
    redirect("/auth/login");
  }


  useEffect(() => {
    const loadData = async () => {
      const res = await apiClient.get('/api/status');
      setMetrics(await res.data);
    };

    socket?.on('new_event', loadData);
    socket?.on('new_alert', loadData);
     loadData();

    return () => {
      socket?.off('new_event', loadData);
      socket?.off('new_alert', loadData);
    };
  }, [socket]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Event Timeline</h2>
        <LineChart data={(metrics as any).eventTimeline} />
      </div>
      
      <div className="bg-card rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">System Health</h2>
        <div className="space-y-4">
          <MetricCard label="Active Incidents" value={(metrics as any).activeIncidents} /> 
          <MetricCard label="24h Alerts" value={(metrics as any).recentAlerts} /> 
          <BarChart data={(metrics as any).alertDistribution } />
        </div>
      </div>

      <div className="lg:col-span-3 bg-card rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Real-Time Event Feed</h2>
        <RealTimeFeed items={(metrics as any).incidents} type={'alerts'} />
      </div>
    </div>
  );
}