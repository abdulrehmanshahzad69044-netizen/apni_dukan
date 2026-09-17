import { useNavigate } from "react-router-dom";
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Building2,
  BookOpen,
  AlertTriangle,
  Boxes,
  Wallet,
  ChevronRight,
  Package,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Page } from "@/components/ui/Page";
import { CenterSpinner } from "@/components/ui/Spinner";
import { QuickActions } from "./QuickActions";
import { KpiTile } from "./KpiTile";
import { useDashboard } from "./hooks";
import {
  formatMoney,
  formatQuantity,
  formatDate,
  paisaToRupees,
} from "@/lib/format";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading } = useDashboard();

  if (loading) {
    return (
      <Page title="Dashboard" description="Business overview.">
        <CenterSpinner />
      </Page>
    );
  }

  const t = data.today;

  return (
    <Page title="Dashboard" description="Business overview at a glance.">
      <div className="space-y-6">
        {/* 1. Quick actions */}
        <QuickActions />

        {/* 2. Today's KPIs */}
        <div>
          <h2 className="text-sm font-medium text-[rgb(var(--muted-fg))] mb-3">
            Today
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiTile
              label="Sales"
              value={formatMoney(t?.totalSales ?? 0, { showDecimals: false })}
              sub={`${t?.billCount ?? 0} bill${
                (t?.billCount ?? 0) !== 1 ? "s" : ""
              }`}
              icon={<Receipt className="w-4 h-4" />}
            />
            <KpiTile
              label="Gross Profit"
              value={formatMoney(t?.grossProfit ?? 0, { showDecimals: false })}
              sub={`${t?.grossMarginPct ?? 0}% margin`}
              tone={(t?.grossProfit ?? 0) >= 0 ? "positive" : "negative"}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <KpiTile
              label="Business Expenses"
              value={formatMoney(t?.businessExpenses ?? 0, {
                showDecimals: false,
              })}
              tone="negative"
              icon={<TrendingDown className="w-4 h-4" />}
            />
            <KpiTile
              label="Net Profit"
              value={formatMoney(t?.netProfit ?? 0, { showDecimals: false })}
              sub={`${t?.netMarginPct ?? 0}% margin`}
              tone={(t?.netProfit ?? 0) >= 0 ? "positive" : "negative"}
              icon={<Wallet className="w-4 h-4" />}
            />
            <KpiTile
              label="Company Payments"
              value={formatMoney(t?.companyPaymentsMade ?? 0, {
                showDecimals: false,
              })}
              tone="negative"
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <KpiTile
              label="Pending Khaata"
              value={formatMoney(data.pendingKhaata, { showDecimals: false })}
              tone={data.pendingKhaata > 0 ? "warning" : "neutral"}
              sub="customer outstanding"
              icon={<BookOpen className="w-4 h-4" />}
              onClick={() => navigate("/khaata")}
            />
            <KpiTile
              label="Low Stock Items"
              value={String(data.inventory?.lowStockCount ?? 0)}
              tone={(data.inventory?.lowStockCount ?? 0) > 0 ? "warning" : "neutral"}
              sub="need reorder"
              icon={<AlertTriangle className="w-4 h-4" />}
              onClick={() => navigate("/inventory")}
            />
            <KpiTile
              label="Out of Stock"
              value={String(data.inventory?.outOfStockCount ?? 0)}
              tone={(data.inventory?.outOfStockCount ?? 0) > 0 ? "negative" : "neutral"}
              sub="variants"
              icon={<Boxes className="w-4 h-4" />}
              onClick={() => navigate("/inventory")}
            />
            <KpiTile
              label="Inventory Value"
              value={formatMoney(data.inventory?.totalStockValue ?? 0, {
                showDecimals: false,
              })}
              sub={`${data.inventory?.totalVariants ?? 0} variants`}
              icon={<Package className="w-4 h-4" />}
              onClick={() => navigate("/inventory")}
            />
          </div>
        </div>

        {/* 3. Sales & Profit — last 7 days */}
        <WeekChart data={data.week} />

        {/* 4. Two-column: Top Products + Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsCard
            data={data.month?.topProducts ?? []}
            onViewAll={() => navigate("/reports")}
          />
          <LowStockCard
            items={data.lowStockItems}
            onViewAll={() => navigate("/inventory")}
          />
        </div>

        {/* 5. Recent bills */}
        <RecentBillsCard
          bills={data.recentBills}
          onViewAll={() => navigate("/billing")}
        />
      </div>
    </Page>
  );
}

// ───────────────────────────────────────────────────────────

function WeekChart({
  data,
}: {
  data: import("../../../electron/shared/types/report").SalesTimePoint[];
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-[rgb(var(--card))] p-6 text-center text-sm text-[rgb(var(--muted-fg))]">
        No sales in the last 7 days.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    day: d.period.slice(5), // mm-dd
    Sales: paisaToRupees(d.sales),
    Profit: paisaToRupees(d.grossProfit),
  }));

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
      <p className="text-sm font-medium mb-3">Last 7 Days — Sales & Profit</p>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="day"
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
            <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopProductsCard({
  data,
  onViewAll,
}: {
  data: import("../../../electron/shared/types/report").TopProductRow[];
  onViewAll: () => void;
}) {
  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <p className="text-sm font-medium">Top Products (this month)</p>
        <button
          onClick={onViewAll}
          className="text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted-fg))] px-4 py-6 text-center">
          No sales yet this month.
        </p>
      ) : (
        <div className="divide-y">
          {data.slice(0, 5).map((p) => (
            <div
              key={p.variantId}
              className="px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.productName}
                </p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  {p.variantName} · {formatQuantity(p.quantitySold)}{" "}
                  {p.baseUnitShortName} sold
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">
                  {formatMoney(p.revenue, { showDecimals: false })}
                </p>
                <p
                  className={`text-xs ${
                    p.profit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  +{formatMoney(p.profit, { showDecimals: false })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LowStockCard({
  items,
  onViewAll,
}: {
  items: import("../../../electron/shared/types/inventory").StockItem[];
  onViewAll: () => void;
}) {
  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <p className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Low Stock Alerts
        </p>
        <button
          onClick={onViewAll}
          className="text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted-fg))] px-4 py-6 text-center">
          All stocked up — no low stock items.
        </p>
      ) : (
        <div className="divide-y">
          {items.slice(0, 5).map((item) => (
            <div
              key={item.variantId}
              className="px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  {item.variantName}
                  {item.lowStockThreshold !== null && (
                    <span>
                      {" "}
                      · threshold {formatQuantity(item.lowStockThreshold)}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold ${
                    item.currentStock === 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {formatQuantity(item.currentStock)}{" "}
                  <span className="text-xs font-normal text-[rgb(var(--muted-fg))]">
                    {item.baseUnitShortName}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentBillsCard({
  bills,
  onViewAll,
}: {
  bills: import("../../../electron/shared/types/bill").Bill[];
  onViewAll: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <p className="text-sm font-medium">Recent Bills</p>
        <button
          onClick={onViewAll}
          className="text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {bills.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted-fg))] px-4 py-6 text-center">
          No bills yet.
        </p>
      ) : (
        <div className="divide-y">
          {bills.map((b) => (
            <button
              key={b.id}
              onClick={() => navigate(`/billing/${b.id}`)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[rgb(var(--muted))] text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                    {b.billNumber}
                  </span>
                  <span className="text-sm truncate">
                    {b.customerName ?? "Walk-in"}
                  </span>
                </div>
                <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">
                  {formatDate(b.billDate)} · {b.itemCount} item
                  {b.itemCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">
                  {formatMoney(b.totalAmount, { showDecimals: false })}
                </p>
                {b.remainingAmount > 0 && b.status === "finalized" ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Due {formatMoney(b.remainingAmount, { showDecimals: false })}
                  </p>
                ) : b.status !== "finalized" ? (
                  <p className="text-xs text-[rgb(var(--muted-fg))] capitalize">
                    {b.status}
                  </p>
                ) : (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Paid
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}