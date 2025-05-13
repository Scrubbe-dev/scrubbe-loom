'use client';
import {  ReportList } from '@/components/reports/report-list';
import {ReportGenerator} from '@/components/reports/report-generator'
import { useSocket } from '@/lib/socket-context';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';
import { useCookiesNext } from 'cookies-next';
import { redirect } from 'next/navigation';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const { socket } = useSocket();

  
  const { hasCookie,getCookie } = useCookiesNext();

  if (hasCookie("user-auth") === false) {
    redirect("/auth/login");
  }


  useEffect(()=>{
    const fetchReports = async () => {
      const res = await apiClient.get('/api/reports');
      setReports(await res.data);
    };

    socket?.on('report_update', fetchReports);
    fetchReports();

    return () => {
      socket?.off('report_update', fetchReports);
    }
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Reports</h1>
        <ReportGenerator />
      </div>
      
      <ReportList reports={reports} />
    </div>
  );
}