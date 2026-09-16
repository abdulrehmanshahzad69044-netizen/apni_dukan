import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { CenterSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DateRangePicker,
  getPresetRange,
  type RangePreset,
} from "./DateRangePicker";
import { SummaryCards } from "./SummaryCards";
import { TrendChart } from "./TrendChart";
import { TopProductsChart } from "./TopProductsChart";
import { ReportTable, type Column } from "./ReportTable";
import { useReport } from "./hooks";
import { dateRangeFilename } from "@/lib/csv";
import {
  formatMoney,
  formatQuantity,
} from "@/lib/format";
import type {
  CollectionRow,
  TopCategoryRow,
  TopCompanyRow,
  TopCustomerRow,
  TopProductRow,
} from "../../../electron/shared/types/report";

export function ReportsPage() {
  const initial = getPresetRange("this_month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [preset, setPreset] = useState<RangePreset>("this_month");
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");

  const query = useMemo(() => {
    // End date: set to end of that day
    const [y, m, d] = to.split("-").map(Number);
    const toDate = new Date(y, m - 1, d, 23, 59, 59);
    const [y2, m2, d2] = from.split("-").map(Number);
    const fromDate = new Date(y2, m2 - 1, d2, 0, 0, 0);
    return { fromDate, toDate, groupBy };
  }, [from, to, groupBy]);

  const { data, loading } = useReport(query);

  const filePrefix = data
    ? dateRangeFilename(data.range.fromDate, data.range.toDate)
    : "report";

  return (
    <Page
      title="Reports"
      description="Sales, profit, and business analytics."
      actions={
        <div className="flex items-center gap-2">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as "day" | "month")}
            className="h-8 px-2 rounded-md border bg-[rgb(var(--bg))] text-xs"
          >
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      }
    >
      <div className="mb-6">
        <DateRangePicker
          from={from}
          to={to}
          preset={preset}
          onChange={(f, t, p) => {
            setFrom(f);
            setTo(t);
            setPreset(p);
          }}
        />
      </div>

      {loading || !data ? (
        <CenterSpinner />
      ) : data.summary.billCount === 0 && data.summary.businessExpenses === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-6 h-6" />}
          title="No activity in this period"
          description="Try a different date range, or start creating bills."
        />
      ) : (
        <div className="space-y-6">
          {/* 1. Summary cards */}
          <SummaryCards summary={data.summary} />

          {/* 2. Trend chart */}
          <TrendChart data={data.timeSeries} />

          {/* 3. Top products chart + table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsChart data={data.topProducts} />
            <TopProductsTable
              rows={data.topProducts}
              csvFilename={`top-products_${filePrefix}`}
            />
          </div>

          {/* 4. Two-column: Categories + Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoriesTable
              rows={data.topCategories}
              csvFilename={`categories_${filePrefix}`}
            />
            <CustomersTable
              rows={data.topCustomers}
              csvFilename={`customers_${filePrefix}`}
            />
          </div>

          {/* 5. Two-column: Companies + Collections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompaniesTable
              rows={data.topCompanies}
              csvFilename={`companies_${filePrefix}`}
            />
            <CollectionsTable
              rows={data.collections}
              csvFilename={`collections_${filePrefix}`}
            />
          </div>
        </div>
      )}
    </Page>
  );
}

// ───────────────────────────────────────────────────────────
// Tables
// ───────────────────────────────────────────────────────────

function TopProductsTable({
  rows,
  csvFilename,
}: {
  rows: TopProductRow[];
  csvFilename: string;
}) {
  const columns: Column<TopProductRow>[] = [
    {
      key: "productName",
      label: "Product",
      render: (r) => r.productName,
    },
    {
      key: "variantName",
      label: "Variant",
      render: (r) => r.variantName,
    },
    {
      key: "quantitySold",
      label: "Qty Sold",
      align: "right",
      render: (r) => formatQuantity(r.quantitySold),
    },
    {
      key: "revenue",
      label: "Revenue",
      align: "right",
      render: (r) => formatMoney(r.revenue, { showDecimals: false }),
    },
    {
      key: "profit",
      label: "Profit",
      align: "right",
      render: (r) => formatMoney(r.profit, { showDecimals: false }),
      cell: (r) => (
        <span
          className={
            r.profit >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {formatMoney(r.profit, { showDecimals: false })}
        </span>
      ),
    },
  ];
  return (
    <ReportTable
      title="Top Products"
      columns={columns}
      rows={rows}
      csvFilename={csvFilename}
    />
  );
}

function CategoriesTable({
  rows,
  csvFilename,
}: {
  rows: TopCategoryRow[];
  csvFilename: string;
}) {
  const columns: Column<TopCategoryRow>[] = [
    { key: "categoryName", label: "Category" },
    {
      key: "itemCount",
      label: "Items Sold",
      align: "right",
    },
    {
      key: "revenue",
      label: "Revenue",
      align: "right",
      render: (r) => formatMoney(r.revenue, { showDecimals: false }),
    },
    {
      key: "profit",
      label: "Profit",
      align: "right",
      render: (r) => formatMoney(r.profit, { showDecimals: false }),
      cell: (r) => (
        <span
          className={
            r.profit >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {formatMoney(r.profit, { showDecimals: false })}
        </span>
      ),
    },
  ];
  return (
    <ReportTable
      title="Top Categories"
      columns={columns}
      rows={rows}
      csvFilename={csvFilename}
    />
  );
}

function CustomersTable({
  rows,
  csvFilename,
}: {
  rows: TopCustomerRow[];
  csvFilename: string;
}) {
  const columns: Column<TopCustomerRow>[] = [
    { key: "customerName", label: "Customer" },
    { key: "billCount", label: "Bills", align: "right" },
    {
      key: "revenue",
      label: "Revenue",
      align: "right",
      render: (r) => formatMoney(r.revenue, { showDecimals: false }),
    },
    {
      key: "currentOutstanding",
      label: "Outstanding",
      align: "right",
      render: (r) => formatMoney(r.currentOutstanding, { showDecimals: false }),
      cell: (r) => (
        <span
          className={
            r.currentOutstanding > 0
              ? "text-amber-600 dark:text-amber-400"
              : ""
          }
        >
          {formatMoney(r.currentOutstanding, { showDecimals: false })}
        </span>
      ),
    },
  ];
  return (
    <ReportTable
      title="Top Customers"
      columns={columns}
      rows={rows}
      csvFilename={csvFilename}
    />
  );
}

function CompaniesTable({
  rows,
  csvFilename,
}: {
  rows: TopCompanyRow[];
  csvFilename: string;
}) {
  const columns: Column<TopCompanyRow>[] = [
    { key: "companyName", label: "Company" },
    { key: "purchaseCount", label: "Purchases", align: "right" },
    {
      key: "totalPurchases",
      label: "Total Bought",
      align: "right",
      render: (r) => formatMoney(r.totalPurchases, { showDecimals: false }),
    },
    {
      key: "totalOutstanding",
      label: "Outstanding",
      align: "right",
      render: (r) => formatMoney(r.totalOutstanding, { showDecimals: false }),
      cell: (r) => (
        <span
          className={
            r.totalOutstanding > 0
              ? "text-amber-600 dark:text-amber-400"
              : ""
          }
        >
          {formatMoney(r.totalOutstanding, { showDecimals: false })}
        </span>
      ),
    },
  ];
  return (
    <ReportTable
      title="Top Suppliers"
      columns={columns}
      rows={rows}
      csvFilename={csvFilename}
    />
  );
}

function CollectionsTable({
  rows,
  csvFilename,
}: {
  rows: CollectionRow[];
  csvFilename: string;
}) {
  const columns: Column<CollectionRow>[] = [
    { key: "customerName", label: "Customer" },
    { key: "paymentCount", label: "Payments", align: "right" },
    {
      key: "totalReceived",
      label: "Received",
      align: "right",
      render: (r) => formatMoney(r.totalReceived, { showDecimals: false }),
      cell: (r) => (
        <span className="text-green-600 dark:text-green-400">
          {formatMoney(r.totalReceived, { showDecimals: false })}
        </span>
      ),
    },
  ];
  return (
    <ReportTable
      title="Collections (Cash In)"
      columns={columns}
      rows={rows}
      csvFilename={csvFilename}
    />
  );
}