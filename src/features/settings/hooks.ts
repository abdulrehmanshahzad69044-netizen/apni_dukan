import { useCallback, useEffect, useState } from "react";
import type { Settings } from "../../../electron/shared/types/settings";
import { settingsApi } from "./api";
import { toast } from "@/lib/toast";

export function useSettings() {
  const [data, setData] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const s = await settingsApi.get();
      setData(s);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}