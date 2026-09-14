import { useCallback, useEffect, useState } from "react";
import type {
  AdjustmentListQuery,
  StockAdjustment,
} from "../../../electron/shared/types/adjustment";
import { adjustmentApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<AdjustmentListQuery>;

export function useAdjustments(query: Query = {}) {
  const [data, setData] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adjustmentApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load adjustments");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.variantId,
    query.adjustmentType,
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