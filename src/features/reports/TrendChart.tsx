import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { paisaToRupees } from "@/lib/format";
import type { SalesTimePoint } from "../../../electron/shared/types/report";

type Props = {
  data: SalesTimePoint[];
};

export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted-fg))]">
        No sales in this period.
      </div>
    );
  }

  // Convert paisa to rupees for display
  const chartData = data.map((d) => ({
    period: d.period,
    Sales: paisaToRupees(d.sales),
    "Gross Profit": paisaToRupees(d.grossProfit),
    "Net Profit": paisaToRupees(d.netProfit),
  }));

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
      <p className="text-sm font-medium mb-3">Sales & Profit Trend</p>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              opacity={0.5}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              opacity={0.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgb(var(--card))",
                border: "1px solid rgb(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => `Rs. ${value}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="Sales"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Gross Profit"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Net Profit"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}