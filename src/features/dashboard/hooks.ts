import { useCallback, useEffect, useState } from "react";
import { reportApi } from "../reports/api";
import { inventoryApi } from "../inventory/api";
import { khaataApi } from "../khaata/api";
import { billApi } from "../bills/api";
import { toast } from "@/lib/toast";
import type {
  FullReport,
  SalesSummary,
  SalesTimePoint,
} from "../../../electron/shared/types/report";
import type { StockItem } from "../../../electron/shared/types/inventory";
import type { Bill } from "../../../electron/shared/types/bill";

type DashboardData = {
  today: SalesSummary | null;
  week: SalesTimePoint[];
  month: FullReport | null;
  inventory: {
    totalVariants: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  } | null;
  lowStockItems: StockItem[];
  pendingKhaata: number;
  recentBills: Bill[];
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    today: null,
    week: [],
    month: null,
    inventory: null,
    lowStockItems: [],
    pendingKhaata: 0,
    recentBills: [],
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6); // 7 days back inclusive
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const [
        today,
        weekReport,
        monthReport,
        invTotals,
        lowStock,
        khaataTotal,
        bills,
      ] = await Promise.all([
        reportApi.today(),
        reportApi.full({ fromDate: weekStart, toDate: now, groupBy: "day" }),
        reportApi.full({
          fromDate: monthStart,
          toDate: monthEnd,
          groupBy: "day",
          limit: 5,
        }),
        inventoryApi.totals(),
        inventoryApi.listStock({ filter: "low", sort: "stock_asc", limit: 20 }),
        khaataApi.totalOutstanding(),
        billApi.list({ limit: 5 }),
      ]);

      setData({
        today,
        week: weekReport.timeSeries,
        month: monthReport,
        inventory: invTotals,
        lowStockItems: lowStock,
        pendingKhaata: khaataTotal,
        recentBills: bills,
      });
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}