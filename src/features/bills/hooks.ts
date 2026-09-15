import { useCallback, useEffect, useState } from "react";
import type {
  Bill,
  BillDetail,
  BillListQuery,
} from "../../../electron/shared/types/bill";
import { billApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<BillListQuery>;

export function useBills(query: Query = {}) {
  const [data, setData] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await billApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load bills");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.customerId,
    query.status,
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

export function useBill(id: number | null) {
  const [data, setData] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    try {
      const b = await billApi.get(id);
      setData(b);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load bill");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}