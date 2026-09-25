import { useEffect, useMemo, useState } from "react";
import { Save, TrendingUp, RefreshCw, Package } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/toast";
import { formatMoney, formatStockDisplay, paisaToRupees, rupeesToPaisa } from "@/lib/format";
import { variantApi, type VolatileVariant } from "../variants/api";

type RowState = {
  variantId: number;
  retail: string;   // rupees as typed
  wholesale: string;
  original: {
    retail: number | null;
    wholesale: number | null;
  };
};

export function UpdatePricesPage() {
  const [items, setItems] = useState<VolatileVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Record<number, RowState>>({});

  async function reload() {
    setLoading(true);
    try {
      const list = await variantApi.listVolatile();
      setItems(list);
      const next: Record<number, RowState> = {};
      for (const it of list) {
        next[it.variantId] = {
          variantId: it.variantId,
          retail:
            it.currentRetail !== null
              ? String(paisaToRupees(it.currentRetail))
              : "",
          wholesale:
            it.currentWholesale !== null
              ? String(paisaToRupees(it.currentWholesale))
              : "",
          original: {
            retail: it.currentRetail,
            wholesale: it.currentWholesale,
          },
        };
      }
      setRows(next);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function updateRow(variantId: number, patch: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], ...patch },
    }));
  }

  const dirtyRows = useMemo(() => {
    return Object.values(rows).filter((r) => {
      const newRetail =
        r.retail.trim() === "" ? null : rupeesToPaisa(Number(r.retail));
      const newWholesale =
        r.wholesale.trim() === "" ? null : rupeesToPaisa(Number(r.wholesale));
      return (
        newRetail !== r.original.retail ||
        newWholesale !== r.original.wholesale
      );
    });
  }, [rows]);

  async function handleSave() {
    if (dirtyRows.length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    try {
      await variantApi.bulkUpdatePrices(
        dirtyRows.map((r) => ({
          variantId: r.variantId,
          retailPrice:
            r.retail.trim() === ""
              ? null
              : rupeesToPaisa(Number(r.retail)),
          wholesalePrice:
            r.wholesale.trim() === ""
              ? null
              : rupeesToPaisa(Number(r.wholesale)),
        }))
      );
      toast.success(
        `Updated ${dirtyRows.length} variant${dirtyRows.length !== 1 ? "s" : ""}`
      );
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title="Update Prices"
      description="Change prices for volatile items like sugar, oil, rice."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={reload} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Save{dirtyRows.length > 0 ? ` (${dirtyRows.length})` : ""}
          </Button>
        </div>
      }
    >
      {loading ? (
        <CenterSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-6 h-6" />}
          title="No price-volatile items"
          description="Go to Variants and click 'Mark Volatile' on items whose prices change frequently (sugar, oil, rice)."
        />
      ) : (
        <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">
                  Product / Variant
                </th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-right px-4 py-3 font-medium">
                  Retail (Rs.)
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  Wholesale (Rs.)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const r = rows[it.variantId];
                if (!r) return null;
                const isDirty =
                  dirtyRows.some((d) => d.variantId === it.variantId);
                return (
                  <tr
                    key={it.variantId}
                    className={`border-t ${
                      isDirty ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{it.productName}</div>
                      <div className="text-xs text-[rgb(var(--muted-fg))]">
                        {it.variantName} · {it.baseUnitShortName}
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-[rgb(var(--muted-fg))]">
                      {formatStockDisplay(it.currentStock, {
                        baseUnitShortName: it.baseUnitShortName,
                      })}
                    </td>
                    <td className="text-right px-4 py-3 w-[140px]">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="—"
                        value={r.retail}
                        onChange={(e) =>
                          updateRow(it.variantId, { retail: e.target.value })
                        }
                        className="text-right"
                      />
                    </td>
                    <td className="text-right px-4 py-3 w-[140px]">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="—"
                        value={r.wholesale}
                        onChange={(e) =>
                          updateRow(it.variantId, {
                            wholesale: e.target.value,
                          })
                        }
                        className="text-right"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 flex items-center gap-2 text-xs text-[rgb(var(--muted-fg))]">
            <Package className="w-3.5 h-3.5" />
            <span>
              Changes apply to all batches with remaining stock. New bills
              will use the updated prices.
            </span>
          </div>
        </div>
      )}
    </Page>
  );
}