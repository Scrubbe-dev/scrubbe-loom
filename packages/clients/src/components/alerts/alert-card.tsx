'use client';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function AlertCard({ alert, onAcknowledge }: {
  alert: any;
  onAcknowledge: (id: string) => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-2 bg-card">
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{alert.title}</h3>
        <Badge variant={alert.severity > 3 ? 'destructive' : 'outline'}>
          {alert.severity}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{alert.description}</p>
      <Button 
        size="sm" 
        onClick={() => onAcknowledge(alert.id)}
      >
        Acknowledge
      </Button>
    </div>
  );
}