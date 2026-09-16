import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { paisaToRupees } from "@/lib/format";
import type { TopProductRow } from "../../../electron/shared/types/report";

type Props = {
  data: TopProductRow[];
};

export function TopProductsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted-fg))]">
        No products sold in this period.
      </div>
    );
  }

  // Bar chart needs short labels — product name only, truncated
  const chartData = data.map((p) => {
    const label =
      p.productName.length > 18
        ? `${p.productName.slice(0, 16)}…`
        : p.productName;
    return {
      name: label,
      Revenue: paisaToRupees(p.revenue),
    };
  });

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
      <p className="text-sm font-medium mb-3">Top Products by Revenue</p>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 40, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              opacity={0.5}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              opacity={0.5}
              width={120}
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
            <Bar dataKey="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}