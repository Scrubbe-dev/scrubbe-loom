// components/feed/real-time-feed.tsx
'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Event, Alert as AlertType, Incident } from '@/types/feed';
import { cn } from '@/lib/utils';

interface RealTimeFeedProps {
  items: Array<Event | AlertType | Incident>;
  type: 'events' | 'alerts' | 'incidents';
  className?: string;
}

export function RealTimeFeed({ items, type, className }: RealTimeFeedProps) {
  const [feedItems, setFeedItems] = useState(items);

  // Update feed when new items come in
  useEffect(() => {
    setFeedItems(items);
  }, [items]);

  const getItemColor = (severity?: number) => {
    if (!severity) return 'bg-blue-100';
    if (severity >= 4) return 'bg-red-100';
    if (severity >= 3) return 'bg-orange-100';
    return 'bg-yellow-100';
  };

  const getItemTitle = (item: any) => {
    switch (type) {
      case 'events':
        return `${item.source} - ${item.type}`;
      case 'alerts':
        return item.rule?.name || 'Security Alert';
      case 'incidents':
        return item.title;
      default:
        return '';
    }
  };

  const getItemDescription = (item: any) => {
    switch (type) {
      case 'events':
        return item.rawData?.message || 'Security event detected';
      case 'alerts':
        return `Severity: ${item.severity}`;
      case 'incidents':
        return item.description;
      default:
        return '';
    }
  };

  const getItemTime = (item: any) => {
    const date = new Date(item.timestamp || item.createdAt);
    return date.toLocaleTimeString();
  };

  return (
    <ScrollArea className={cn('h-[400px]', className)}>
      <div className="space-y-2">
        {feedItems.length === 0 && (
          <Alert>
            <AlertTitle>No {type} found</AlertTitle>
            <AlertDescription>
              No {type} have been detected yet.
            </AlertDescription>
          </Alert>
        )}

        {feedItems.map((item, index) => (
          <Alert 
            key={index} 
            className={cn(
              'transition-all hover:shadow-md',
              getItemColor((item as any).severity)
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <AlertTitle className="flex items-center gap-2">
                  {getItemTitle(item)}
                  {type === 'alerts' && (
                    <Badge variant="outline">
                      {(item as AlertType).status}
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription>
                  {getItemDescription(item)}
                </AlertDescription>
              </div>
              <div className="text-xs text-muted-foreground">
                {getItemTime(item)}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  );
}