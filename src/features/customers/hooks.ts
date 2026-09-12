import { useCallback, useEffect, useState } from "react";
import type {
  Customer,
  CustomerListQuery,
} from "../../../electron/shared/types/customer";
import { customerApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<CustomerListQuery>;

export function useCustomers(query: Query = {}) {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await customerApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load customers");
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