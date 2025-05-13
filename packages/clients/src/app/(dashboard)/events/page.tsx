'use client';
import { EventTimeline } from '@/components/events/event-timeline';
import { useSocket } from '@/lib/socket-context';
import { useCookiesNext } from 'cookies-next';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const { socket } = useSocket();
  const { hasCookie,getCookie } = useCookiesNext();

  if (hasCookie("user-auth") === false) {
    redirect("/auth/login");
  }

//@ts-ignore
  useEffect(()=>{
    const loadEvents = async () => {
      const res = await fetch('/api/events');
      setEvents(await res.json());
    };

    socket?.on('new_event', (event: any) => {
        //@ts-ignore
      setEvents((prev) => [event, ...prev.slice(0, 100)]);
    });

    loadEvents();

    return () => socket?.off('new_event');
  }, [socket]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Security Events</h1>
      <EventTimeline events={events} />
    </div>
  );
}