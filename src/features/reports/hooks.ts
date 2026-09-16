import { useCallback, useEffect, useState } from "react";
import type {
  FullReport,
  ReportQuery,
} from "../../../electron/shared/types/report";
import { reportApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<ReportQuery>;

export function useReport(query: Query = {}) {
  const [data, setData] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await reportApi.full(query);
      setData(r);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load report");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.fromDate, query.toDate, query.groupBy, query.limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}