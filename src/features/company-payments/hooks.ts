import { useCallback, useEffect, useState } from "react";
import type {
  CompanyPayment,
  CompanyPaymentListQuery,
} from "../../../electron/shared/types/expense";
import { companyPaymentApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<CompanyPaymentListQuery>;

export function useCompanyPayments(query: Query = {}) {
  const [data, setData] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await companyPaymentApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load company payments");
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