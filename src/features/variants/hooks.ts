import { useCallback, useEffect, useState } from "react";
import type {
  Variant,
  VariantListQuery,
} from "../../../electron/shared/types/variant";
import { variantApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<VariantListQuery>;

export function useVariants(query: Query = {}) {
  const [data, setData] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await variantApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load variants");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.search,
    query.productId,
    query.includeDeleted,
    query.limit,
    query.offset,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}