import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, X, Search } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/lib/toast";
import {
  formatMoney,
  rupeesToPaisa,
  quantityToMilli,
  formatQuantity,
  toDateInputValue,
} from "@/lib/format";
import {
  getUnitOptions,
  enteredQtyToBase,
  baseUnitPriceFromEntered,
  defaultPurchaseUnit,
} from "@/lib/units";
import { purchaseApi } from "./api";
import { useCompanies } from "../companies/hooks";
import { useVariants } from "../variants/hooks";
import type { Variant } from "../../../electron/shared/types/variant";

type LineItem = {
  key: string;
  variantId: number;
  productName: string;
  variantName: string;
  baseUnitId: number;
  baseUnitName: string;
  baseUnitShortName: string;
  purchaseUnitId: number | null;
  purchaseUnitName: string | null;
  purchaseUnitShortName: string | null;
  purchaseUnitFactor: number | null;

  enteredUnitId: number;

  quantity: string;
  purchasePrice: string;
  suggestedRetailPrice: string;
  suggestedWholesalePrice: string;
};

function makeKey() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Convert a price from one unit to another by ratio.
 * "Rs. 70 per Piece" → "Rs. 1680 per Carton" (ratio 24/1)
 * "Rs. 1680 per Carton" → "Rs. 70 per Piece" (ratio 1/24)
 */
function convertPriceByRatio(price: string, ratio: number): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n === 0) return price;
  const result = n * ratio;
  // Format with up to 2 decimals, strip trailing zeros
  return Number.isInteger(result)
    ? String(result)
    : result.toFixed(2).replace(/\.?0+$/, "");
}

export function PurchaseEntryPage() {
  const navigate = useNavigate();

  const [companyId, setCompanyId] = useState<number | "">("");
  const [purchaseDate, setPurchaseDate] = useState(toDateInputValue(new Date()));
  const [remarks, setRemarks] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [variantSearch, setVariantSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: companies } = useCompanies();
  const { data: variants } = useVariants({
    search: variantSearch.trim() || undefined,
  });

  // ---------- Computed totals ----------

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const qty = Number(l.quantity) || 0;
      const price = Number(l.purchasePrice) || 0;
      return sum + rupeesToPaisa(qty * price);
    }, 0);
  }, [lines]);

  const paidPaisa = useMemo(() => {
    const n = Number(paidAmount) || 0;
    return rupeesToPaisa(n);
  }, [paidAmount]);

  const remaining = subtotal - paidPaisa;

  // ---------- Actions ----------

  function addVariant(v: Variant) {
    if (lines.some((l) => l.variantId === v.id)) {
      toast.error(`${v.productName} — ${v.name} is already in the list`);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: makeKey(),
        variantId: v.id,
        productName: v.productName,
        variantName: v.name,
        baseUnitId: v.baseUnitId,
        baseUnitName: v.baseUnitName,
        baseUnitShortName: v.baseUnitShortName,
        purchaseUnitId: v.purchaseUnitId,
        purchaseUnitName: v.purchaseUnitName,
        purchaseUnitShortName: v.purchaseUnitShortName,
        purchaseUnitFactor: v.purchaseUnitFactor,
        enteredUnitId: defaultPurchaseUnit(v),
        quantity: "1",
        purchasePrice: "0",
        suggestedRetailPrice: "0",
        suggestedWholesalePrice: "0",
      },
    ]);
    setVariantSearch("");
  }

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  /**
   * Change the unit for a line + convert all prices by the factor ratio.
   */
  function changeUnit(key: string, newUnitId: number) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        if (l.enteredUnitId === newUnitId) return l;

        const unitOptions = getUnitOptions(l);
        const oldUnit =
          unitOptions.find((u) => u.unitId === l.enteredUnitId) ??
          unitOptions[0];
        const newUnit =
          unitOptions.find((u) => u.unitId === newUnitId) ?? unitOptions[0];

        // Ratio: how much bigger/smaller the new unit is vs the old one.
        // If old = Piece (factor 1), new = Carton (factor 24), ratio = 24.
        const ratio = newUnit.factor / oldUnit.factor;

        return {
          ...l,
          enteredUnitId: newUnitId,
          purchasePrice: convertPriceByRatio(l.purchasePrice, ratio),
          suggestedRetailPrice: convertPriceByRatio(
            l.suggestedRetailPrice,
            ratio
          ),
          suggestedWholesalePrice: convertPriceByRatio(
            l.suggestedWholesalePrice,
            ratio
          ),
        };
      })
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function handleSave() {
    if (companyId === "") {
      toast.error("Select a company");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    for (const l of lines) {
      const qty = Number(l.quantity);
      const price = Number(l.purchasePrice);
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(`Invalid quantity for ${l.productName} — ${l.variantName}`);
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        toast.error(`Invalid price for ${l.productName} — ${l.variantName}`);
        return;
      }
    }

    setSaving(true);
    try {
      await purchaseApi.create({
        companyId: Number(companyId),
        purchaseDate: new Date(purchaseDate),
        paidAmount: paidPaisa,
        remarks: remarks.trim() || undefined,
        lines: lines.map((l) => {
          const unitOptions = getUnitOptions(l);
          const enteredUnit =
            unitOptions.find((u) => u.unitId === l.enteredUnitId) ??
            unitOptions[0];
          const factor = enteredUnit.factor;

          const qtyInBase = enteredQtyToBase(Number(l.quantity), factor);
          const basePriceRupees = baseUnitPriceFromEntered(
            Number(l.quantity),
            Number(l.purchasePrice),
            factor
          );
          const basePricePaisa = rupeesToPaisa(basePriceRupees);

          const retailBaseRupees = Number(l.suggestedRetailPrice) / factor;
          const wholesaleBaseRupees =
            Number(l.suggestedWholesalePrice) / factor;

          return {
            variantId: l.variantId,
            quantity: quantityToMilli(qtyInBase),
            purchasePrice: basePricePaisa,
            suggestedRetailPrice:
              Number(l.suggestedRetailPrice) > 0
                ? rupeesToPaisa(retailBaseRupees)
                : null,
            suggestedWholesalePrice:
              Number(l.suggestedWholesalePrice) > 0
                ? rupeesToPaisa(wholesaleBaseRupees)
                : null,
          };
        }),
      });
      toast.success("Purchase recorded");
      navigate("/purchases");
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title="New Purchase"
      description="Record stock bought from a company."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/purchases")}
            disabled={saving}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Save Purchase
          </Button>
        </div>
      }
    >
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-1.5">
          <Label>Company *</Label>
          <select
            value={companyId}
            onChange={(e) =>
              setCompanyId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
          >
            <option value="">— Select company —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purchase-date">Date</Label>
          <Input
            id="purchase-date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purchase-remarks">Remarks</Label>
          <Input
            id="purchase-remarks"
            placeholder="Optional"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border bg-[rgb(var(--card))] p-4 mb-6">
        <Label className="mb-2 block">Add Item</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <Input
            placeholder="Search product or variant…"
            value={variantSearch}
            onChange={(e) => setVariantSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {variantSearch.trim() && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-[rgb(var(--bg))]">
            {variants.length === 0 ? (
              <p className="p-3 text-sm text-[rgb(var(--muted-fg))]">
                No variants match
              </p>
            ) : (
              variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addVariant(v)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[rgb(var(--muted))] border-b last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {v.productName}
                    </div>
                    <div className="text-xs text-[rgb(var(--muted-fg))]">
                      {v.name} · {v.baseUnitShortName}
                      {v.purchaseUnitShortName && v.purchaseUnitFactor && (
                        <span className="text-blue-600 dark:text-blue-400 ml-2">
                          · 1 {v.purchaseUnitShortName} ={" "}
                          {v.purchaseUnitFactor} {v.baseUnitShortName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-[rgb(var(--muted-fg))] shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lines */}
      {lines.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-6 h-6" />}
          title="No items yet"
          description="Search for a variant above and click to add it."
        />
      ) : (
        <div className="space-y-3 mb-6">
          {lines.map((l) => {
            const unitOptions = getUnitOptions(l);
            const enteredUnit =
              unitOptions.find((u) => u.unitId === l.enteredUnitId) ??
              unitOptions[0];
            const factor = enteredUnit.factor;

            const enteredTotal = rupeesToPaisa(
              (Number(l.quantity) || 0) * (Number(l.purchasePrice) || 0)
            );

            const qtyInBase = (Number(l.quantity) || 0) * factor;
            const basePrice = baseUnitPriceFromEntered(
              Number(l.quantity) || 0,
              Number(l.purchasePrice) || 0,
              factor
            );
            const showBasePreview = factor > 1;

            return (
              <div
                key={l.key}
                className="rounded-xl border bg-[rgb(var(--card))] p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{l.productName}</h4>
                    <p className="text-xs text-[rgb(var(--muted-fg))]">
                      {l.variantName}
                      {l.purchaseUnitFactor && l.purchaseUnitShortName && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          1 {l.purchaseUnitShortName} ={" "}
                          {l.purchaseUnitFactor} {l.baseUnitShortName}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(l.key)}
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
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
                    <Label className="text-xs">Unit</Label>
                    <select
                      value={l.enteredUnitId}
                      onChange={(e) =>
                        changeUnit(l.key, Number(e.target.value))
                      }
                      className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
                    >
                      {unitOptions.map((u) => (
                        <option key={u.unitId} value={u.unitId}>
                          {u.unitShortName} ({u.unitName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">
                      Price per {enteredUnit.unitShortName} (Rs.)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.purchasePrice}
                      onChange={(e) =>
                        updateLine(l.key, { purchasePrice: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">
                      Retail per {enteredUnit.unitShortName} (Rs.)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.suggestedRetailPrice}
                      onChange={(e) =>
                        updateLine(l.key, {
                          suggestedRetailPrice: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">
                      Wholesale per {enteredUnit.unitShortName} (Rs.)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.suggestedWholesalePrice}
                      onChange={(e) =>
                        updateLine(l.key, {
                          suggestedWholesalePrice: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {showBasePreview && Number(l.quantity) > 0 && (
                  <div className="mt-2 text-xs text-[rgb(var(--muted-fg))]">
                    = {formatQuantity(quantityToMilli(qtyInBase))}{" "}
                    {l.baseUnitShortName} @{" "}
                    {formatMoney(rupeesToPaisa(basePrice))} /{" "}
                    {l.baseUnitShortName}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted-fg))]">
                    {Number(l.quantity || 0).toFixed(2)}{" "}
                    {enteredUnit.unitShortName} × Rs.{" "}
                    {Number(l.purchasePrice || 0).toFixed(2)}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(enteredTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totals */}
      <div className="rounded-xl border bg-[rgb(var(--card))] p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgb(var(--muted-fg))]">Subtotal</span>
              <span className="font-medium">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgb(var(--muted-fg))]">Items count</span>
              <span className="font-medium">{lines.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="paid-amount">Paid Now (Rs.)</Label>
              <Input
                id="paid-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgb(var(--muted-fg))]">Remaining</span>
              <span
                className={`font-semibold ${
                  remaining > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[rgb(var(--fg))]"
                }`}
              >
                {formatMoney(remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold">{formatMoney(subtotal)}</span>
        </div>
      </div>
    </Page>
  );
}