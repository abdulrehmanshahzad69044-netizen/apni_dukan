import { useCallback, useEffect, useState } from "react";
import type {
  Company,
  CompanyListQuery,
} from "../../../electron/shared/types/company";
import { companyApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<CompanyListQuery>;

export function useCompanies(query: Query = {}) {
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await companyApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load companies");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.includeDeleted, query.limit, query.offset]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}