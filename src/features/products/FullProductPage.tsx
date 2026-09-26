import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Package,
  Layers,
  Boxes,
} from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/toast";
import {
  formatMoney,
  formatQuantity,
  quantityToMilli,
  rupeesToPaisa,
  paisaToRupees,
  milliToQuantity,
} from "@/lib/format";
import { productApi } from "./api";
import { categoryApi } from "../categories/api";
import { companyApi } from "../companies/api";
import { unitApi } from "../units/api";
import { useCategories } from "../categories/hooks";
import { useCompanies } from "../companies/hooks";
import { useUnits } from "../units/hooks";

/**
 * Which unit a specific field is being entered in.
 * "base" = the variant's base unit (e.g. Bottle)
 * "bulk" = the variant's purchase unit (e.g. Crate)
 */
type FieldUnit = "base" | "bulk";

export function FullProductPage() {
  const navigate = useNavigate();

  // Product
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [companyId, setCompanyId] = useState<number | "">("");

  // Variant
  const [variantName, setVariantName] = useState("");
  const [baseUnitId, setBaseUnitId] = useState<number | "">("");
  const [purchaseUnitId, setPurchaseUnitId] = useState<number | "">("");
  const [purchaseUnitFactor, setPurchaseUnitFactor] = useState("");

  // Field units — one per field
  const [quantityUnit, setQuantityUnit] = useState<FieldUnit>("base");
  const [costUnit, setCostUnit] = useState<FieldUnit>("base");
  const [retailUnit, setRetailUnit] = useState<FieldUnit>("base");
  const [wholesaleUnit, setWholesaleUnit] = useState<FieldUnit>("base");
  const [thresholdUnit, setThresholdUnit] = useState<FieldUnit>("base");

  // Opening stock
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [retail, setRetail] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [threshold, setThreshold] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline creation modals
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [newUnitOpen, setNewUnitOpen] = useState(false);

  const { data: categories, reload: reloadCats } = useCategories();
  const { data: companies, reload: reloadCompanies } = useCompanies();
  const { data: units, reload: reloadUnits } = useUnits();

  // ── Derived values ──
  const factor = useMemo(() => {
    if (purchaseUnitId === "") return 1;
    const n = Number(purchaseUnitFactor);
    if (!Number.isFinite(n) || n <= 1) return 1;
    return Math.round(n);
  }, [purchaseUnitId, purchaseUnitFactor]);

  const hasBulk = factor > 1;

  // Auto-toggle to bulk default when a bulk unit becomes available
  // (once when the factor first becomes > 1)
  const [autoToggled, setAutoToggled] = useState(false);
  useEffect(() => {
    if (hasBulk && !autoToggled) {
      setQuantityUnit("bulk");
      setCostUnit("bulk");
      setRetailUnit("bulk");
      setWholesaleUnit("bulk");
      setThresholdUnit("bulk");
      setAutoToggled(true);
    }
    if (!hasBulk && autoToggled) {
      setQuantityUnit("base");
      setCostUnit("base");
      setRetailUnit("base");
      setWholesaleUnit("base");
      setThresholdUnit("base");
      setAutoToggled(false);
    }
  }, [hasBulk, autoToggled]);

  // ── Conversions (live previews) ──
  // For quantity: base = entered * factor (if bulk); bulk = entered
  const qtyNum = Number(quantity) || 0;
  const qtyInBase = quantityUnit === "bulk" ? qtyNum * factor : qtyNum;

  // For prices: base price = entered / factor (if bulk); bulk price = entered
  const costNum = Number(cost) || 0;
  const costInBase =
    costUnit === "bulk" && factor > 0 ? costNum / factor : costNum;

  const retailNum = Number(retail) || 0;
  const retailInBase =
    retailUnit === "bulk" && factor > 0 ? retailNum / factor : retailNum;

  const wholesaleNum = Number(wholesale) || 0;
  const wholesaleInBase =
    wholesaleUnit === "bulk" && factor > 0
      ? wholesaleNum / factor
      : wholesaleNum;

  const thresholdNum = Number(threshold) || 0;
  const thresholdInBase =
    thresholdUnit === "bulk" ? thresholdNum * factor : thresholdNum;

  // Opening stock value (base qty × base cost)
  const openingStockValue = rupeesToPaisa(qtyInBase * costInBase);

  // Units short names
  const baseUnitShort =
    units.find((u) => u.id === baseUnitId)?.shortName ?? "base";
  const bulkUnitShort =
    units.find((u) => u.id === purchaseUnitId)?.shortName ?? "bulk";

  // ── Conversion preview text ──
  function qtyPreview(): string | null {
    if (!hasBulk || quantityUnit !== "bulk") return null;
    return `= ${formatQuantity(quantityToMilli(qtyInBase))} ${baseUnitShort}`;
  }

  function costPreview(): string | null {
    if (!hasBulk || costUnit !== "bulk") return null;
    return `= ${formatMoney(rupeesToPaisa(costInBase))} per ${baseUnitShort}`;
  }

  function retailPreview(): string | null {
    if (!hasBulk || retailUnit !== "bulk") return null;
    return `= ${formatMoney(rupeesToPaisa(retailInBase))} per ${baseUnitShort}`;
  }

  function wholesalePreview(): string | null {
    if (!hasBulk || wholesaleUnit !== "bulk") return null;
    return `= ${formatMoney(rupeesToPaisa(wholesaleInBase))} per ${baseUnitShort}`;
  }

  function thresholdPreview(): string | null {
    if (!hasBulk || thresholdUnit !== "bulk") return null;
    return `= ${formatQuantity(quantityToMilli(thresholdInBase))} ${baseUnitShort}`;
  }

  // ── Quick toggle all fields ──
  function setAllUnits(u: FieldUnit) {
    setQuantityUnit(u);
    setCostUnit(u);
    setRetailUnit(u);
    setWholesaleUnit(u);
    setThresholdUnit(u);
  }

  // ── Submit ──
  async function handleSave() {
    if (!productName.trim()) return setError("Product name is required");
    if (!variantName.trim()) return setError("Variant name is required");
    if (baseUnitId === "") return setError("Base unit is required");

    if (!Number.isFinite(qtyInBase) || qtyInBase <= 0) {
      return setError("Opening quantity must be positive");
    }
    if (!Number.isFinite(costInBase) || costInBase < 0) {
      return setError("Opening cost must be non-negative");
    }

    const hasPurchaseUnit = purchaseUnitId !== "";
    if (hasPurchaseUnit && factor <= 1) {
      return setError("Bulk conversion must be a whole number above 1");
    }
    if (!hasPurchaseUnit && purchaseUnitFactor.trim() !== "") {
      return setError("Select a bulk unit or clear the factor");
    }

    setSaving(true);
    setError(null);
    try {
      const created = await productApi.createFull({
        productName: productName.trim(),
        categoryId: categoryId === "" ? null : Number(categoryId),
        companyId: companyId === "" ? null : Number(companyId),
        variantName: variantName.trim(),
        baseUnitId: Number(baseUnitId),
        purchaseUnitId: hasPurchaseUnit ? Number(purchaseUnitId) : null,
        purchaseUnitFactor: hasPurchaseUnit ? factor : null,
        lowStockThreshold:
          threshold.trim() === ""
            ? null
            : quantityToMilli(thresholdInBase),
        openingQuantity: quantityToMilli(qtyInBase),
        openingCost: rupeesToPaisa(costInBase),
        suggestedRetailPrice:
          retail.trim() === "" ? null : rupeesToPaisa(retailInBase),
        suggestedWholesalePrice:
          wholesale.trim() === "" ? null : rupeesToPaisa(wholesaleInBase),
      });
      toast.success(`"${created.name}" created with opening stock`);
      navigate("/products");
    } catch (e) {
      const msg = (e as Error).message ?? "Failed to save";
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Page
        title="Add Full Product"
        description="Create a product with variant and opening stock in one step."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/products")}
              disabled={saving}
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4" />
              Save Product
            </Button>
          </div>
        }
      >
        <div className="max-w-3xl space-y-6">
          {/* ─── PRODUCT ─── */}
          <section className="rounded-xl border bg-[rgb(var(--card))] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <h2 className="text-base font-semibold">Product</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fp-name">Product Name *</Label>
                <Input
                  id="fp-name"
                  autoFocus
                  placeholder="e.g. Coca Cola"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Category</Label>
                    <button
                      type="button"
                      onClick={() => setNewCategoryOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
                  >
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Company</Label>
                    <button
                      type="button"
                      onClick={() => setNewCompanyOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New
                    </button>
                  </div>
                  <select
                    value={companyId}
                    onChange={(e) =>
                      setCompanyId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
                  >
                    <option value="">— None —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ─── VARIANT ─── */}
          <section className="rounded-xl border bg-[rgb(var(--card))] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <h2 className="text-base font-semibold">Variant</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-variant">Variant Name *</Label>
                  <Input
                    id="fp-variant"
                    placeholder="e.g. 1.5L, 250ml, Large"
                    value={variantName}
                    onChange={(e) => {
                      setVariantName(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Base Unit *</Label>
                    <button
                      type="button"
                      onClick={() => setNewUnitOpen(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New
                    </button>
                  </div>
                  <select
                    value={baseUnitId}
                    onChange={(e) =>
                      setBaseUnitId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
                  >
                    <option value="">— Select unit —</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border bg-[rgb(var(--bg))] p-4 space-y-3">
                <p className="text-xs font-medium text-[rgb(var(--muted-fg))]">
                  BULK UNIT (optional)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bulk Unit</Label>
                    <select
                      value={purchaseUnitId}
                      onChange={(e) => {
                        setPurchaseUnitId(
                          e.target.value === "" ? "" : Number(e.target.value)
                        );
                        if (error) setError(null);
                      }}
                      className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
                    >
                      <option value="">— None —</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-factor">Contents per Bulk Unit</Label>
                    <Input
                      id="fp-factor"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 24"
                      value={purchaseUnitFactor}
                      disabled={purchaseUnitId === ""}
                      onChange={(e) => {
                        setPurchaseUnitFactor(e.target.value);
                        if (error) setError(null);
                      }}
                    />
                  </div>
                </div>
                {hasBulk && (
                  <div className="rounded-md bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-400 font-medium">
                    1 {bulkUnitShort} = {factor} {baseUnitShort}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ─── OPENING STOCK ─── */}
          <section className="rounded-xl border bg-[rgb(var(--card))] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
                <h2 className="text-base font-semibold">Opening Stock</h2>
              </div>

              {hasBulk && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAllUnits("base")}
                    className="text-xs px-2 py-1 rounded-md border hover:bg-[rgb(var(--muted))]"
                  >
                    All {baseUnitShort}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllUnits("bulk")}
                    className="text-xs px-2 py-1 rounded-md border hover:bg-[rgb(var(--muted))]"
                  >
                    All {bulkUnitShort}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="fp-qty">Opening Quantity *</Label>
                <div className="flex gap-2">
                  <Input
                    id="fp-qty"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 8"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      if (error) setError(null);
                    }}
                    className="flex-1"
                  />
                  <UnitDropdown
                    value={quantityUnit}
                    hasBulk={hasBulk}
                    baseShort={baseUnitShort}
                    bulkShort={bulkUnitShort}
                    onChange={setQuantityUnit}
                  />
                </div>
                {qtyPreview() && (
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {qtyPreview()}
                  </p>
                )}
              </div>

              {/* Cost */}
              <div className="space-y-1.5">
                <Label htmlFor="fp-cost">Cost per Unit (Rs.) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="fp-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 480"
                    value={cost}
                    onChange={(e) => {
                      setCost(e.target.value);
                      if (error) setError(null);
                    }}
                    className="flex-1"
                  />
                  <UnitDropdown
                    value={costUnit}
                    hasBulk={hasBulk}
                    baseShort={baseUnitShort}
                    bulkShort={bulkUnitShort}
                    onChange={setCostUnit}
                  />
                </div>
                {costPreview() && (
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {costPreview()}
                  </p>
                )}
              </div>

              {/* Retail */}
              <div className="space-y-1.5">
                <Label htmlFor="fp-retail">
                  Suggested Retail (Rs.) <span className="text-[rgb(var(--muted-fg))] font-normal">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="fp-retail"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 720"
                    value={retail}
                    onChange={(e) => setRetail(e.target.value)}
                    className="flex-1"
                  />
                  <UnitDropdown
                    value={retailUnit}
                    hasBulk={hasBulk}
                    baseShort={baseUnitShort}
                    bulkShort={bulkUnitShort}
                    onChange={setRetailUnit}
                  />
                </div>
                {retailPreview() && (
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {retailPreview()}
                  </p>
                )}
              </div>

              {/* Wholesale */}
              <div className="space-y-1.5">
                <Label htmlFor="fp-wholesale">
                  Suggested Wholesale (Rs.) <span className="text-[rgb(var(--muted-fg))] font-normal">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="fp-wholesale"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 660"
                    value={wholesale}
                    onChange={(e) => setWholesale(e.target.value)}
                    className="flex-1"
                  />
                  <UnitDropdown
                    value={wholesaleUnit}
                    hasBulk={hasBulk}
                    baseShort={baseUnitShort}
                    bulkShort={bulkUnitShort}
                    onChange={setWholesaleUnit}
                  />
                </div>
                {wholesalePreview() && (
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {wholesalePreview()}
                  </p>
                )}
              </div>

              {/* Low stock */}
              <div className="space-y-1.5">
                <Label htmlFor="fp-threshold">Low Stock Alert</Label>
                <div className="flex gap-2">
                  <Input
                    id="fp-threshold"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 2"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="flex-1"
                  />
                  <UnitDropdown
                    value={thresholdUnit}
                    hasBulk={hasBulk}
                    baseShort={baseUnitShort}
                    bulkShort={bulkUnitShort}
                    onChange={setThresholdUnit}
                  />
                </div>
                {thresholdPreview() && (
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {thresholdPreview()}
                  </p>
                )}
              </div>

              {/* Opening stock value */}
              {openingStockValue > 0 && (
                <div className="rounded-lg bg-[rgb(var(--muted))] px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted-fg))]">
                    Total opening stock value
                  </span>
                  <span className="font-semibold">
                    {formatMoney(openingStockValue)}
                  </span>
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </Page>

      {/* ── Inline quick-create modals ── */}
      <QuickCreateModal
        open={newCategoryOpen}
        onClose={() => setNewCategoryOpen(false)}
        title="New Category"
        placeholder="e.g. Beverages"
        onSave={async (name) => {
          const c = await categoryApi.create({ name });
          await reloadCats();
          setCategoryId(c.id);
        }}
      />

      <QuickCreateModal
        open={newCompanyOpen}
        onClose={() => setNewCompanyOpen(false)}
        title="New Company"
        placeholder="e.g. Nestle"
        onSave={async (name) => {
          const c = await companyApi.create({ name });
          await reloadCompanies();
          setCompanyId(c.id);
        }}
      />

      <QuickCreateModal
        open={newUnitOpen}
        onClose={() => setNewUnitOpen(false)}
        title="New Unit"
        placeholder="e.g. Carton"
        secondFieldPlaceholder="Short name (e.g. ctn)"
        secondFieldRequired
        onSave={async (name, shortName) => {
          const u = await unitApi.create({
            name,
            shortName: shortName ?? name.slice(0, 4).toLowerCase(),
          });
          await reloadUnits();
          setBaseUnitId(u.id);
        }}
      />
    </>
  );
}

/* ────────────────────────────────────────────
   Unit Dropdown
   ──────────────────────────────────────────── */

function UnitDropdown({
  value,
  hasBulk,
  baseShort,
  bulkShort,
  onChange,
}: {
  value: FieldUnit;
  hasBulk: boolean;
  baseShort: string;
  bulkShort: string;
  onChange: (u: FieldUnit) => void;
}) {
  if (!hasBulk) {
    return (
      <div className="h-10 px-3 rounded-lg border bg-[rgb(var(--muted))] text-sm flex items-center min-w-[80px] justify-center text-[rgb(var(--muted-fg))]">
        {baseShort}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FieldUnit)}
      className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm min-w-[90px]"
    >
      <option value="base">{baseShort}</option>
      <option value="bulk">{bulkShort}</option>
    </select>
  );
}

/* ────────────────────────────────────────────
   Inline Quick Create Modal
   ──────────────────────────────────────────── */

function QuickCreateModal({
  open,
  onClose,
  title,
  placeholder,
  secondFieldPlaceholder,
  secondFieldRequired,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  secondFieldPlaceholder?: string;
  secondFieldRequired?: boolean;
  onSave: (name: string, secondField?: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [secondField, setSecondField] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return setError("Name is required");
    if (secondFieldRequired && !secondField.trim()) {
      return setError("Short name is required");
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), secondField.trim() || undefined);
      setName("");
      setSecondField("");
      onClose();
    } catch (e) {
      const msg = (e as Error).message ?? "Failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setName("");
        setSecondField("");
        setError(null);
        onClose();
      }}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input
            autoFocus
            placeholder={placeholder}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        {secondFieldPlaceholder && (
          <div className="space-y-1.5">
            <Label>Short Name</Label>
            <Input
              placeholder={secondFieldPlaceholder}
              value={secondField}
              onChange={(e) => {
                setSecondField(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
            />
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}