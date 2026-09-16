import { useCallback, useEffect, useState } from "react";
import type {
  Expense,
  ExpenseListQuery,
} from "../../../electron/shared/types/expense";
import { expenseApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<ExpenseListQuery>;

export function useExpenses(query: Query = {}) {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await expenseApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load expenses");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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