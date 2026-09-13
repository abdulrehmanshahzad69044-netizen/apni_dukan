import { useCallback, useEffect, useState } from "react";
import type {
  Purchase,
  PurchaseListQuery,
  StockBatch,
} from "../../../electron/shared/types/purchase";
import { purchaseApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<PurchaseListQuery>;

export function usePurchases(query: Query = {}) {
  const [data, setData] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await purchaseApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load purchases");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.companyId,
    query.search,
    query.fromDate,
    query.toDate,
    query.limit,
    query.offset,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export function usePurchase(id: number | null) {
  const [data, setData] = useState<Purchase | null>(null);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    try {
      const [p, b] = await Promise.all([
        purchaseApi.get(id),
        purchaseApi.getBatches(id),
      ]);
      setData(p);
      setBatches(b);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load purchase");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, batches, loading, reload };
}