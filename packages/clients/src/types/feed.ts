export interface Event {
    id: string;
    timestamp: string;
    source: string;
    type: string;
    severity?: number;
    rawData: any;
    processed: boolean;
  }
  
  export interface Alert {
    id: string;
    createdAt: string;
    rule?: {
      name: string;
    };
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'SUPPRESSED';
    severity: number;
  }
  
  export interface Incident {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: string;
  }