'use client';
import { Timeline } from 'vis-timeline/standalone';
import { useEffect, useRef } from 'react';

export function EventTimeline({ events }: { events: any[] }) {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      const items = events.map(event => ({
        id: event.id,
        content: event.type,
        start: new Date(event.timestamp),
        type: 'point',
      }));

      new Timeline(timelineRef.current, items, {
        showCurrentTime: true,
        zoomable: true,
      });
    }
  }, [events]);

  return <div ref={timelineRef} className="h-96" />;
}