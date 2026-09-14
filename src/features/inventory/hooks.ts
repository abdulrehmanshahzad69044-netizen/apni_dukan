import { useCallback, useEffect, useState } from "react";
import type {
  StockItem,
  StockListQuery,
} from "../../../electron/shared/types/inventory";
import { inventoryApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<StockListQuery>;

export function useStock(query: Query = {}) {
  const [data, setData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await inventoryApi.listStock(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load stock");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.filter, query.sort, query.limit, query.offset]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export function useInventoryTotals() {
  const [data, setData] = useState<{
    totalVariants: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const t = await inventoryApi.totals();
      setData(t);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load totals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}