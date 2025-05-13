'use client';

import { IncidentColumn } from "@/components/incidents/incident-column";

const incidents = [
  { id: "1", title: "Unauthorized Access", severity: 4, status: "OPEN" },
  { id: "2", title: "Brute Force Attempt", severity: 3, status: "IN_PROGRESS" },
  { id: "3", title: "Malware Detection", severity: 5, status: "OPEN" },
  { id: "4", title: "Data Exfiltration", severity: 5, status: "RESOLVED" },
];

export function IncidentOverview() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Incident Management</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {["OPEN", "IN_PROGRESS", "RESOLVED"].map((status,index) => (
        //   <IncidentColumn
        //     key={status}
        //     status={status}
        //     incidents={incidents.filter((i) => i.status === status)}
        //   />
        <div key={index}></div>
        ))}
      </div>
    </div>
  );
}