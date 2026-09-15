import { useCallback, useEffect, useState } from "react";
import type {
  Payment,
  PaymentDetail,
  PaymentListQuery,
} from "../../../electron/shared/types/payment";
import { paymentApi } from "./api";
import { toast } from "@/lib/toast";

type Query = Partial<PaymentListQuery>;

export function usePayments(query: Query = {}) {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await paymentApi.list(query);
      setData(rows);
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message ?? "Failed to load payments");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.customerId,
    query.search,
    query.fromDate,
    query.toDate,
    query.limit,
    query.offset,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function usePayment(id: number | null) {
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    try {
      const p = await paymentApi.get(id);
      setData(p);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load payment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}