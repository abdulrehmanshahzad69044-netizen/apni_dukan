import { useCallback, useEffect, useState } from "react";
import type {
  Unit,
  UnitConversion,
  UnitListQuery,
} from "../../../electron/shared/types/unit";
import { unitApi, unitConversionApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<UnitListQuery>;

export function useUnits(query: Query = {}) {
  const [data, setData] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await unitApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load units");
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

export function useUnitConversions(filter?: { unitId?: number }) {
  const [data, setData] = useState<UnitConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await unitConversionApi.list(filter);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load conversions");
    } finally {
      setLoading(false);
    }
  }, [filter?.unitId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}