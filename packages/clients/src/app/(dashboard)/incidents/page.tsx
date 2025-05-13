'use client';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { IncidentColumn } from '@/components/incidents/incident-column';
import { useState , useEffect } from 'react';
import { useCookiesNext } from 'cookies-next';
import { redirect } from 'next/navigation';
import apiClient from '@/lib/axios';

const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);

     const { hasCookie,getCookie } = useCookiesNext();
  
      if (hasCookie("user-auth") === false) {
        redirect("/auth/login");
      }
  

  useEffect(() => {
    const loadIncidents = async () => {
      const res = await apiClient.get('/api/incidents');
      setIncidents(await res.data);
    };
    loadIncidents();
  }, []);

  const handleDragEnd = async (result: { destination: { droppableId: any; }; draggableId: any; }) => {
    if (!result.destination) return;

    await apiClient.put(`/api/incidents/${result.draggableId}`, { status: result.destination.droppableId });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd as any}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {statuses.map(status => (
          <IncidentColumn 
            key={status} 
            status={status}
            incidents={incidents.filter((i:any) => i?.status === status)}
          />
        ))}
      </div>
    </DragDropContext>
  );
}