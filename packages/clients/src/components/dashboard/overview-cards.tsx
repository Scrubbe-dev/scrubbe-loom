import { Card } from "@/components/ui/card";

const stats = [
  { title: "Open Incidents", value: "12", change: "+2", trend: "up" },
  { title: "Active Alerts", value: "24", change: "-5", trend: "down" },
  { title: "Data Sources", value: "5", change: "+1", trend: "up" },
  { title: "MTTR", value: "2.4h", change: "-0.5h", trend: "down" },
];

export function OverviewCards() {
  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{stat.value}</p>
              <span
                className={`text-sm ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}