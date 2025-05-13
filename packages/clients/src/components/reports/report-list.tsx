// components/reports/report-list.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { format } from 'date-fns';

interface Report {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
}

interface ReportListProps {
  reports: Report[];
}

export function ReportList({ reports }: ReportListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{report.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    report.status === 'completed'
                      ? 'default'
                      : report.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(report.createdAt), 'PPpp')}
              </TableCell>
              <TableCell>
                {report.status === 'completed' && report.downloadUrl ? (
                  <a
                    href={report.downloadUrl}
                    download
                    className="text-primary hover:underline"
                  >
                    <Icons.download className="h-5 w-5" />
                  </a>
                ) : (
                  <Icons.clock className="h-5 w-5 text-muted-foreground" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}