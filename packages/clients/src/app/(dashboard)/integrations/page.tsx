'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntegrationModal } from '@/components/integrations/integration-modal';
import { DataTable } from '@/components/data-table';
import { columns } from '../../../components/integrations/columns';
import { useSocket } from '@/lib/socket-context';
import apiClient from '@/lib/axios';
import { useCookiesNext } from 'cookies-next';
import { redirect } from 'next/navigation';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const { socket } = useSocket();

  const { hasCookie,getCookie } = useCookiesNext();

  if (hasCookie("user-auth") === false) {
    redirect("/auth/login");
  }


  useEffect(() => {
    const fetchIntegrations = async () => {
      const res = await apiClient.get('/api/integrations');
      console.log(res)
      const data = await res.data;
      setIntegrations(data);
    };

    socket?.on('integration_update', fetchIntegrations);
    fetchIntegrations();

    return () => {
      socket?.off('integration_update', fetchIntegrations);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Integrations</h1>
        <Button onClick={() => setOpenModal(true)}>New Integration</Button>
      </div>

      <DataTable 
        columns={columns} 
        data={integrations} 
        // filterKey="type"
      />

      <IntegrationModal 
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={(newIntegration) => {
          console.log(newIntegration,'from integration')
          setIntegrations([...integrations, newIntegration]);
          setOpenModal(false);
        }}
      />
    </div>
  );
}