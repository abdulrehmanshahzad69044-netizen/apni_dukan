import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  X,
  Search,
  UserPlus,
  AlertTriangle,
  FileEdit,
  PauseCircle,
  Info,
} from "lucide-react";
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
  formatStockDisplay,
  toDateInputValue,
} from "@/lib/format";
import {
  getUnitOptions,
  enteredQtyToBase,
  baseUnitPriceFromEntered,
  defaultBillUnit,
} from "@/lib/units";
import { billApi } from "./api";
import { PriceModeToggle, type PriceMode } from "./PriceModeToggle";
import { useCustomers } from "../customers/hooks";
import { useVariants } from "../variants/hooks";
import { useStock } from "../inventory/hooks";
import { QuickAddCustomerModal } from "./QuickAddCustomerModal";
import type { Variant } from "../../../electron/shared/types/variant";
import type { Customer } from "../../../electron/shared/types/customer";
import type { StockItem } from "../../../electron/shared/types/inventory";

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
  unitPrice: string;
  priceMode: PriceMode;
  latestRetailPricePaisa: number | null;
  latestWholesalePricePaisa: number | null;
  availableStock: number;
  /** Weighted average cost per base unit (paisa) */
  avgCostPaisa: number;
};

type BillStatus = "finalized" | "draft" | "held";

function makeKey() {
  return Math.random().toString(36).slice(2, 10);
}

function convertPriceByRatio(price: string, ratio: number): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n === 0) return price;
  const result = n * ratio;
  return Number.isInteger(result)
    ? String(result)
    : result.toFixed(2).replace(/\.?0+$/, "");
}

export function BillEntryPage() {
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState<number | "">("");
  const [billDate, setBillDate] = useState(toDateInputValue(new Date()));
  const [remarks, setRemarks] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [variantSearch, setVariantSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { data: customers, reload: reloadCustomers } = useCustomers();
  const { data: variants } = useVariants({
    search: variantSearch.trim() || undefined,
  });
  const { data: stock } = useStock({ filter: "in" });

  const stockByVariant = useMemo(() => {
    const m = new Map<number, StockItem>();
    for (const s of stock) m.set(s.variantId, s);
    return m;
  }, [stock]);

  const selectedCustomer = useMemo(() => {
    if (customerId === "") return null;
    return customers.find((c) => c.id === customerId) ?? null;
  }, [customerId, customers]);

  // ---------- Totals ----------

  const billTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const qty = Number(l.quantity) || 0;
      const price = Number(l.unitPrice) || 0;
      return sum + rupeesToPaisa(qty * price);
    }, 0);
  }, [lines]);

  const previousOutstanding = selectedCustomer?.cachedOutstanding ?? 0;
  const totalRecoverable = previousOutstanding + billTotal;

  const paidPaisa = useMemo(() => {
    const n = Number(paidAmount) || 0;
    return rupeesToPaisa(n);
  }, [paidAmount]);

  // Clamp remaining to 0 — no negative remaining
  const remainingAfter = Math.max(0, totalRecoverable - paidPaisa);

  // ---------- Actions ----------

  function addVariant(v: Variant) {
    if (lines.some((l) => l.variantId === v.id)) {
      toast.error(`${v.productName} — ${v.name} is already in the bill`);
      return;
    }
    const stockItem = stockByVariant.get(v.id);
    const retail = stockItem?.latestRetailPrice ?? null;
    const wholesale = stockItem?.latestWholesalePrice ?? null;
    const defaultPrice = retail !== null ? String(retail / 100) : "0";

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
        enteredUnitId: defaultBillUnit(v),
        quantity: "1",
        unitPrice: defaultPrice,
        priceMode: "retail",
        latestRetailPricePaisa: retail,
        latestWholesalePricePaisa: wholesale,
        availableStock: stockItem?.currentStock ?? 0,
        avgCostPaisa: stockItem?.avgCost ?? 0,
      },
    ]);
    setVariantSearch("");
  }

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

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

        const ratio = newUnit.factor / oldUnit.factor;
        return {
          ...l,
          enteredUnitId: newUnitId,
          unitPrice: convertPriceByRatio(l.unitPrice, ratio),
        };
      })
    );
  }

  function changePriceMode(key: string, newMode: PriceMode) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;

        const unitOptions = getUnitOptions(l);
        const enteredUnit =
          unitOptions.find((u) => u.unitId === l.enteredUnitId) ??
          unitOptions[0];
        const factor = enteredUnit.factor;

        const sourcePaisa =
          newMode === "wholesale"
            ? l.latestWholesalePricePaisa
            : l.latestRetailPricePaisa;

        if (sourcePaisa === null) {
          return { ...l, priceMode: newMode };
        }

        const newPriceRupees = (sourcePaisa * factor) / 100;
        return {
          ...l,
          priceMode: newMode,
          unitPrice: String(newPriceRupees),
        };
      })
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function onCustomerCreated(c: Customer) {
    void reloadCustomers();
    setCustomerId(c.id);
  }

  async function saveWithStatus(status: BillStatus) {
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    for (const l of lines) {
      const qty = Number(l.quantity);
      const price = Number(l.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(`Invalid quantity for ${l.productName} — ${l.variantName}`);
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        toast.error(`Invalid price for ${l.productName} — ${l.variantName}`);
        return;
      }
    }

    if (status === "finalized" && paidPaisa > totalRecoverable) {
      toast.error(
        "Paid amount cannot exceed total recoverable (previous + today)"
      );
      return;
    }

    setSaving(true);
    try {
      const created = await billApi.create({
        customerId: customerId === "" ? null : Number(customerId),
        billDate: new Date(billDate),
        paidAmount: status === "finalized" ? paidPaisa : 0,
        remarks: remarks.trim(),
        status,
        lines: lines.map((l) => {
          const unitOptions = getUnitOptions(l);
          const enteredUnit =
            unitOptions.find((u) => u.unitId === l.enteredUnitId) ??
            unitOptions[0];
          const factor = enteredUnit.factor;

          const qtyInBase = enteredQtyToBase(Number(l.quantity), factor);
          const basePriceRupees = baseUnitPriceFromEntered(
            Number(l.quantity),
            Number(l.unitPrice),
            factor
          );

          return {
            variantId: l.variantId,
            unitId: l.baseUnitId,
            quantity: quantityToMilli(qtyInBase),
            unitPrice: rupeesToPaisa(basePriceRupees),
          };
        }),
      });

      const label =
        status === "draft" ? "Draft" : status === "held" ? "Held bill" : "Bill";
      toast.success(`${label} ${created.billNumber} saved`);
      navigate(`/billing/${created.id}`);
    } catch (e) {
      console.error("Bill create error:", e);
      toast.error((e as Error).message ?? "Failed to save bill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Page
        title="New Bill"
        description="Create a sale."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/billing")}
              disabled={saving}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => saveWithStatus("held")}
              disabled={saving}
            >
              <PauseCircle className="w-4 h-4" />
              Hold
            </Button>
            <Button
              variant="outline"
              onClick={() => saveWithStatus("draft")}
              disabled={saving}
            >
              <FileEdit className="w-4 h-4" />
              Draft
            </Button>
            <Button onClick={() => saveWithStatus("finalized")} loading={saving}>
              <Save className="w-4 h-4" />
              Save Bill
            </Button>
          </div>
        }
      >
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <div className="flex gap-2">
              <select
                value={customerId}
                onChange={(e) =>
                  setCustomerId(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="flex-1 h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
              >
                <option value="">— Walk-in (cash) —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => setQuickAddOpen(true)}
                title="Quick add customer"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-date">Date</Label>
            <Input
              id="bill-date"
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-remarks">Remarks</Label>
            <Input
              id="bill-remarks"
              placeholder="Optional"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {selectedCustomer && previousOutstanding > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">{selectedCustomer.name}</span> has a
              previous outstanding of{" "}
              <span className="font-semibold">
                {formatMoney(previousOutstanding)}
              </span>
              .
            </div>
          </div>
        )}

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
            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border bg-[rgb(var(--bg))]">
              {variants.length === 0 ? (
                <p className="p-3 text-sm text-[rgb(var(--muted-fg))]">
                  No variants match
                </p>
              ) : (
                variants.map((v) => {
                  const s = stockByVariant.get(v.id);
                  const available = s?.currentStock ?? 0;
                  const out = available <= 0;
                  const retail = s?.latestRetailPrice ?? null;
                  return (
                    <button
                      key={v.id}
                      onClick={() => addVariant(v)}
                      disabled={out}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left border-b last:border-b-0 ${
                        out
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-[rgb(var(--muted))]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {v.productName}
                        </div>
                        <div className="text-xs text-[rgb(var(--muted-fg))]">
                          {v.name} · {v.baseUnitShortName}
                        </div>
                      </div>
                      <div className="text-right shrink-0 mr-2">
                        <div className="text-xs text-[rgb(var(--muted-fg))]">
                          Stock
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            out ? "text-red-600 dark:text-red-400" : ""
                          }`}
                        >
                          {formatQuantity(available)}
                        </div>
                      </div>
                      <div className="text-right shrink-0 mr-2">
                        <div className="text-xs text-[rgb(var(--muted-fg))]">
                          Retail
                        </div>
                        <div className="text-sm font-medium">
                          {retail !== null
                            ? formatMoney(retail, { showDecimals: false })
                            : "—"}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-[rgb(var(--muted-fg))] shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Lines */}
        {lines.length === 0 ? (
          <EmptyState
            icon={<Plus className="w-6 h-6" />}
            title="No items yet"
            description="Search for a product above to add it to the bill."
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
                (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)
              );

              const qtyInBase = (Number(l.quantity) || 0) * factor;
              const qtyMilli = quantityToMilli(qtyInBase);
              const exceedsStock = qtyMilli > l.availableStock;

              const basePrice = baseUnitPriceFromEntered(
                Number(l.quantity) || 0,
                Number(l.unitPrice) || 0,
                factor
              );
              const showBasePreview = factor > 1;

              const wholesaleAvailable = l.latestWholesalePricePaisa !== null;

              // COST — always from avgCostPaisa (per base unit)
              const costPerEnteredUnitPaisa = l.avgCostPaisa * factor;

              return (
                <div
                  key={l.key}
                  className={`rounded-xl border bg-[rgb(var(--card))] p-4 ${
                    exceedsStock ? "border-red-500/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h4 className="font-medium truncate">
                        {l.productName}
                      </h4>
                      <p className="text-xs text-[rgb(var(--muted-fg))]">
                        {l.variantName} · Available:{" "}
                        {formatStockDisplay(l.availableStock, {
                          baseUnitShortName: l.baseUnitShortName,
                          purchaseUnitShortName: l.purchaseUnitShortName,
                          purchaseUnitFactor: l.purchaseUnitFactor,
                        })}
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

                  <div className="grid grid-cols-3 gap-3">
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
                        className={
                          exceedsStock
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      />
                      {exceedsStock && (
                        <p className="text-xs text-red-600">
                          Exceeds available stock
                        </p>
                      )}
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
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">
                          Price per {enteredUnit.unitShortName} (Rs.)
                        </Label>
                        <PriceModeToggle
                          mode={l.priceMode}
                          onChange={(m) => changePriceMode(l.key, m)}
                          wholesaleAvailable={wholesaleAvailable}
                        />
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.unitPrice}
                        onChange={(e) =>
                          updateLine(l.key, { unitPrice: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {showBasePreview && Number(l.quantity) > 0 && (
                    <div className="mt-2 text-xs text-[rgb(var(--muted-fg))]">
                      = {formatQuantity(qtyMilli)} {l.baseUnitShortName} @{" "}
                      {formatMoney(rupeesToPaisa(basePrice))} /{" "}
                      {l.baseUnitShortName}
                    </div>
                  )}

                  {/* COST — internal only, never printed */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-[rgb(var(--muted-fg))]">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>
                      Cost:{" "}
                      <span className="font-mono">
                        {formatMoney(l.avgCostPaisa)} / {l.baseUnitShortName}
                      </span>
                      {l.purchaseUnitShortName &&
                        l.purchaseUnitFactor &&
                        l.purchaseUnitFactor > 1 && (
                          <span className="ml-1">
                            (=
                            {formatMoney(costPerEnteredUnitPaisa)} /{" "}
                            {l.purchaseUnitShortName})
                          </span>
                        )}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-[rgb(var(--muted-fg))]">
                      {Number(l.quantity || 0).toFixed(2)}{" "}
                      {enteredUnit.unitShortName} × Rs.{" "}
                      {Number(l.unitPrice || 0).toFixed(2)}
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

        {/* Summary */}
        <div className="rounded-xl border bg-[rgb(var(--card))] p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {selectedCustomer && previousOutstanding > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted-fg))]">
                    Previous outstanding
                  </span>
                  <span className="font-medium">
                    {formatMoney(previousOutstanding)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[rgb(var(--muted-fg))]">
                  Today's bill total
                </span>
                <span className="font-medium">{formatMoney(billTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-[rgb(var(--muted-fg))]">
                  Total recoverable
                </span>
                <span className="font-semibold">
                  {formatMoney(totalRecoverable)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[rgb(var(--muted-fg))]">
                  Items in bill
                </span>
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
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPaidAmount(String(billTotal / 100))}
                    className="text-xs px-2 py-1 rounded border hover:bg-[rgb(var(--muted))]"
                  >
                    Bill total
                  </button>
                  {selectedCustomer && previousOutstanding > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPaidAmount(String(totalRecoverable / 100))
                      }
                      className="text-xs px-2 py-1 rounded border hover:bg-[rgb(var(--muted))]"
                    >
                      All (incl. previous)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaidAmount("")}
                    className="text-xs px-2 py-1 rounded border hover:bg-[rgb(var(--muted))]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-[rgb(var(--muted-fg))]">
                  Remaining after this bill
                </span>
                <span
                  className={`font-semibold ${
                    remainingAfter > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {formatMoney(remainingAfter)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t flex items-center justify-between">
            <span className="text-lg font-semibold">Bill Total</span>
            <span className="text-2xl font-bold">
              {formatMoney(billTotal)}
            </span>
          </div>
        </div>
      </Page>

      <QuickAddCustomerModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={onCustomerCreated}
      />
    </>
  );
}