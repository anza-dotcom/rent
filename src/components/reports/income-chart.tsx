"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DataPoint {
  month: string;
  collected: number;
  potential: number;
}

export function IncomeChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis
            className="text-xs"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: number) => `$${v.toLocaleString()}`}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Bar dataKey="potential" fill="hsl(var(--muted-foreground) / 0.3)" name="Potential" />
          <Bar dataKey="collected" fill="hsl(var(--primary))" name="Collected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
