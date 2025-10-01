"use client";
import { Card } from "@/components/ui/card";

export default function StatsCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : null}
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      </div>
      <div className="mt-2 text-4xl font-semibold">{value}</div>
    </Card>
  );
}
