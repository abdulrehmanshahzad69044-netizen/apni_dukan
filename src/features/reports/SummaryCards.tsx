import { formatMoney } from "@/lib/format";
import type { SalesSummary } from "../../../electron/shared/types/report";

type Props = {
  summary: SalesSummary;
};

export function SummaryCards({ summary }: Props) {
  return (
    <div className="space-y-4">
      {/* Row 1 — headline numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          label="Total Sales"
          value={formatMoney(summary.totalSales, { showDecimals: false })}
          sub={`${summary.billCount} bill${summary.billCount !== 1 ? "s" : ""}`}
        />
        <Card
          label="Gross Profit"
          value={formatMoney(summary.grossProfit, { showDecimals: false })}
          sub={`${summary.grossMarginPct}% margin`}
          tone={summary.grossProfit >= 0 ? "positive" : "negative"}
        />
        <Card
          label="Business Expenses"
          value={formatMoney(summary.businessExpenses, { showDecimals: false })}
          sub="operating costs"
          tone="negative"
        />
        <Card
          label="Net Profit"
          value={formatMoney(summary.netProfit, { showDecimals: false })}
          sub={`${summary.netMarginPct}% margin`}
          tone={summary.netProfit >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Row 2 — cash & flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SmallCard
          label="COGS"
          value={formatMoney(summary.totalCogs, { showDecimals: false })}
        />
        <SmallCard
          label="Avg Bill"
          value={formatMoney(summary.avgBillValue, { showDecimals: false })}
        />
        <SmallCard
          label="Cash In (from customers)"
          value={formatMoney(summary.customerPaymentsReceived, {
            showDecimals: false,
          })}
          tone="positive"
        />
        <SmallCard
          label="Paid to Companies"
          value={formatMoney(summary.companyPaymentsMade, {
            showDecimals: false,
          })}
          tone="negative"
        />
        <SmallCard
          label="Cash Outflow"
          value={formatMoney(summary.cashOutflow, { showDecimals: false })}
          tone="negative"
        />
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const valueClass =
    tone === "positive"
      ? "text-green-600 dark:text-green-400"
      : tone === "negative"
      ? "text-red-600 dark:text-red-400"
      : "";

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
      <p className="text-xs text-[rgb(var(--muted-fg))]">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">{sub}</p>}
    </div>
  );
}

function SmallCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-green-600 dark:text-green-400"
      : tone === "negative"
      ? "text-red-600 dark:text-red-400"
      : "";

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted-fg))]">
        {label}
      </p>
      <p className={`text-sm font-medium mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}