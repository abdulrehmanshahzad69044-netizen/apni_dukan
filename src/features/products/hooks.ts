import { useCallback, useEffect, useState } from "react";
import type {
  Product,
  ProductListQuery,
} from "../../../electron/shared/types/product";
import { productApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<ProductListQuery>;

export function useProducts(query: Query = {}) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await productApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.search,
    query.categoryId,
    query.companyId,
    query.includeDeleted,
    query.limit,
    query.offset,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}