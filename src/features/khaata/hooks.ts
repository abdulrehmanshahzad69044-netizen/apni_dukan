import { useCallback, useEffect, useState } from "react";
import type {
  KhaataDetail,
  KhaataEntry,
  KhaataListQuery,
} from "../../../electron/shared/types/payment";
import { khaataApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<KhaataListQuery>;

export function useKhaataList(query: Query = {}) {
  const [data, setData] = useState<KhaataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await khaataApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load khaata");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.limit, query.offset]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useKhaataDetail(customerId: number | null) {
  const [data, setData] = useState<KhaataDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (customerId === null) return;
    setLoading(true);
    try {
      const d = await khaataApi.detail(customerId);
      setData(d);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load khaata detail");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}