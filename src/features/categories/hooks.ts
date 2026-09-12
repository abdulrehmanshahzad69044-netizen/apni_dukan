import { useCallback, useEffect, useState } from "react";
import type {
  Category,
  CategoryListQuery,
} from "../../../electron/shared/types/category";
import { categoryApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<CategoryListQuery>;

export function useCategories(query: Query = {}) {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await categoryApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load categories");
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