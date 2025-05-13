import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataSourceIntegration } from "@/types/index"
import { CellContext } from "@tanstack/react-table"

export const columns: ColumnDef<DataSourceIntegration>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }: CellContext<DataSourceIntegration, unknown>) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: CellContext<DataSourceIntegration, unknown>) => {
      const status = row.getValue("status") as 'active' | 'inactive'
      return (
        <Badge variant={status === 'active' ? 'default' : 'destructive'}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "lastSynced",
    header: "Last Synced",
    cell: ({ row }: CellContext<DataSourceIntegration, unknown>) => {
      const date = new Date(row.getValue("lastSynced"))
      return date.toLocaleString()
    },
  },
  {
    accessorKey: "errorCount",
    header: "Errors",
    cell: ({ row }: CellContext<DataSourceIntegration, unknown>) => {
      const count = row.getValue("errorCount") as number
      return count > 0 ? (
        <Badge variant="destructive">{count}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
]