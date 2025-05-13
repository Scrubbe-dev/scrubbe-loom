// components/reports/report-generator.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';

export function ReportGenerator() {
  const generateReport = async (type: string) => {
    try {
      const res = await apiClient.post('/reports/generate', { type });

      if (!res) throw new Error('Failed to generate report');
      
      toast.success(`${type} report generated successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Icons.plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => generateReport('Daily')}>
          Daily Summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateReport('Weekly')}>
          Weekly Summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateReport('Incident')}>
          Incident Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}