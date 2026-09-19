import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Package, AlertCircle } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/toast";
import {
  formatMoney,
  formatQuantity,
  rupeesToPaisa,
  quantityToMilli,
} from "@/lib/format";
import { openingStockApi } from "./api";
import { useVariants } from "../variants/hooks";
import { useStock } from "../inventory/hooks";
import type { Variant } from "../../../electron/shared/types/variant";
import type { StockItem } from "../../../electron/shared/types/inventory";
import type { OpeningStockEntry } from "../../../electron/shared/types/opening-stock";

type Line = {
  key: string;
  variantId: number;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
  purchaseUnitShortName: string | null;
  purchaseUnitFactor: number | null;
  quantity: string;
  price: string;
};

function makeKey() {
  return Math.random().toString(36).slice(2, 10);
}

export function OpeningStockPage() {
  const [entries, setEntries] = useState<OpeningStockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: variants } = useVariants({
    search: search.trim() || undefined,
  });
  const { data: stock } = useStock({});

  const stockByVariant = useMemo(() => {
    const m = new Map<number, StockItem>();
    for (const s of stock) m.set(s.variantId, s);
    return m;
  }, [stock]);

  async function reload() {
    setLoading(true);
    try {
      const rows = await openingStockApi.list();
      setEntries(rows);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function addVariant(v: Variant) {
    if (lines.some((l) => l.variantId === v.id)) {
      toast.error("Already in the list");
      return;
    }
    const s = stockByVariant.get(v.id);
    const lastCost = s?.avgCost ?? 0;

    setLines((prev) => [
      ...prev,
      {
        key: makeKey(),
        variantId: v.id,
        productName: v.productName,
        variantName: v.name,
        baseUnitShortName: v.baseUnitShortName,
        purchaseUnitShortName: v.purchaseUnitShortName,
        purchaseUnitFactor: v.purchaseUnitFactor,
        quantity: "",
        price: lastCost > 0 ? String(lastCost / 100) : "",
      },
    ]);
    setSearch("");
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const totalValue = useMemo(() => {
    return lines.reduce((sum, l) => {
      const qty = Number(l.quantity) || 0;
      const price = Number(l.price) || 0;
      return sum + rupeesToPaisa(qty * price);
    }, 0);
  }, [lines]);

  async function handleSave() {
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    for (const l of lines) {
      const q = Number(l.quantity);
      const p = Number(l.price);
      if (!Number.isFinite(q) || q <= 0) {
        toast.error(`Invalid quantity for ${l.productName} — ${l.variantName}`);
        return;
      }
      if (!Number.isFinite(p) || p < 0) {
        toast.error(`Invalid cost for ${l.productName} — ${l.variantName}`);
        return;
      }
    }

    setSaving(true);
    try {
      const created = await openingStockApi.create({
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantity: quantityToMilli(Number(l.quantity)),
          purchasePrice: rupeesToPaisa(Number(l.price)),
        })),
      });
      toast.success(`Added ${created.length} opening stock entries`);
      setLines([]);
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(batchId: number) {
    if (!confirm("Delete this opening stock entry?")) return;
    try {
      await openingStockApi.remove(batchId);
      toast.success("Deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <Page
      title="Opening Stock"
      description="Record the inventory you currently have before using Apni Dukan."
      actions={
        lines.length > 0 && (
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Save {lines.length} item{lines.length !== 1 ? "s" : ""}
          </Button>
        )
      }
    >
      {/* Info banner */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 mb-6 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-400">
          <p className="font-medium">One-time migration</p>
          <p className="mt-1">
            Enter the stock you currently have. This creates opening batches
            that work with FIFO just like regular purchases. Delete them if you
            make a mistake — but only before they're sold.
          </p>
        </div>
      </div>

      {/* Add item search */}
      <div className="rounded-xl border bg-[rgb(var(--card))] p-4 mb-6">
        <Label className="mb-2 block">Add Item</Label>
        <Input
          placeholder="Search product or variant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search.trim() && (
          <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border bg-[rgb(var(--bg))]">
            {variants.length === 0 ? (
              <p className="p-3 text-sm text-[rgb(var(--muted-fg))]">
                No variants match
              </p>
            ) : (
              variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addVariant(v)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left border-b last:border-b-0 hover:bg-[rgb(var(--muted))]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {v.productName}
                    </div>
                    <div className="text-xs text-[rgb(var(--muted-fg))]">
                      {v.name} · {v.baseUnitShortName}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Pending lines */}
      {lines.length > 0 && (
        <div className="space-y-3 mb-6">
          {lines.map((l) => (
            <div
              key={l.key}
              className="rounded-xl border bg-[rgb(var(--card))] p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="font-medium">{l.productName}</h4>
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {l.variantName} · {l.baseUnitShortName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(l.key)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">
                    Quantity ({l.baseUnitShortName})
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={l.quantity}
                    onChange={(e) =>
                      updateLine(l.key, { quantity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Cost per {l.baseUnitShortName} (Rs.)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.price}
                    onChange={(e) =>
                      updateLine(l.key, { price: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4 flex justify-between items-center">
            <span className="text-sm font-medium">Total opening value</span>
            <span className="text-lg font-semibold">
              {formatMoney(totalValue)}
            </span>
          </div>
        </div>
      )}

      {/* Existing entries */}
      <h2 className="text-base font-semibold mb-3">Existing Opening Stock</h2>
      {loading ? (
        <CenterSpinner />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="No opening stock recorded yet"
          description="Add items above and click Save."
        />
      ) : (
        <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">
                  Product / Variant
                </th>
                <th className="text-right px-4 py-2 font-medium">Quantity</th>
                <th className="text-right px-4 py-2 font-medium">
                  Cost per unit
                </th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.batchId} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.productName}</div>
                    <div className="text-xs text-[rgb(var(--muted-fg))]">
                      {e.variantName}
                    </div>
                  </td>
                  <td className="text-right px-4 py-3">
                    {formatQuantity(e.quantity)} {e.baseUnitShortName}
                  </td>
                  <td className="text-right px-4 py-3">
                    {formatMoney(e.purchasePrice)}
                  </td>
                  <td className="text-right px-4 py-3 font-medium">
                    {formatMoney(
                      Math.round((e.quantity * e.purchasePrice) / 1000)
                    )}
                  </td>
                  <td className="text-right px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(e.batchId)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}