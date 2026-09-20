import { useMemo, useState } from "react";
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
} from "@/lib/format";
import { productApi } from "./api";
import { categoryApi } from "../categories/api";
import { companyApi } from "../companies/api";
import { unitApi } from "../units/api";
import { useCategories } from "../categories/hooks";
import { useCompanies } from "../companies/hooks";
import { useUnits } from "../units/hooks";

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
  const [threshold, setThreshold] = useState("");

  // Opening stock
  const [openingQuantity, setOpeningQuantity] = useState("");
  const [openingCost, setOpeningCost] = useState("");
  const [retail, setRetail] = useState("");
  const [wholesale, setWholesale] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline "New X" modals
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [newUnitOpen, setNewUnitOpen] = useState(false);

  const { data: categories, reload: reloadCats } = useCategories();
  const { data: companies, reload: reloadCompanies } = useCompanies();
  const { data: units, reload: reloadUnits } = useUnits();

  // Live preview
  const previewStock = useMemo(() => {
    const qty = Number(openingQuantity) || 0;
    const cost = Number(openingCost) || 0;
    return rupeesToPaisa(qty * cost);
  }, [openingQuantity, openingCost]);

  const previewConversion = useMemo(() => {
    if (purchaseUnitId === "" || !purchaseUnitFactor) return null;
    const f = Number(purchaseUnitFactor);
    if (!Number.isFinite(f) || f <= 1) return null;
    const from = units.find((u) => u.id === purchaseUnitId);
    const to = baseUnitId !== "" ? units.find((u) => u.id === baseUnitId) : null;
    if (!from || !to) return null;
    return `1 ${from.name} = ${f} ${to.name}${f !== 1 ? "s" : ""}`;
  }, [purchaseUnitId, purchaseUnitFactor, baseUnitId, units]);

  async function handleSave() {
    if (!productName.trim()) return setError("Product name is required");
    if (!variantName.trim()) return setError("Variant name is required");
    if (baseUnitId === "") return setError("Base unit is required");
    const qty = Number(openingQuantity);
    const cost = Number(openingCost);
    if (!Number.isFinite(qty) || qty <= 0) {
      return setError("Opening quantity must be positive");
    }
    if (!Number.isFinite(cost) || cost < 0) {
      return setError("Opening cost must be non-negative");
    }

    const hasPurchaseUnit = purchaseUnitId !== "";
    const factor = purchaseUnitFactor.trim() === ""
      ? null
      : Number(purchaseUnitFactor);
    if (hasPurchaseUnit && (!factor || factor <= 1)) {
      return setError("Bulk conversion must be a whole number above 1");
    }
    if (!hasPurchaseUnit && factor !== null) {
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
        purchaseUnitFactor:
          hasPurchaseUnit && factor ? Math.round(factor) : null,
        lowStockThreshold:
          threshold.trim() === ""
            ? null
            : quantityToMilli(Number(threshold)),
        openingQuantity: quantityToMilli(qty),
        openingCost: rupeesToPaisa(cost),
        suggestedRetailPrice:
          retail.trim() === "" ? null : rupeesToPaisa(Number(retail)),
        suggestedWholesalePrice:
          wholesale.trim() === "" ? null : rupeesToPaisa(Number(wholesale)),
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
          {/* ── Product Section ── */}
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

          {/* ── Variant Section ── */}
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
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    Stock will be tracked in this unit
                  </p>
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
                {previewConversion && (
                  <div className="rounded-md bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-400 font-medium">
                    {previewConversion}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fp-threshold">Low Stock Threshold</Label>
                <Input
                  id="fp-threshold"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 10"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  Alert when stock drops to this level (in base units)
                </p>
              </div>
            </div>
          </section>

          {/* ── Opening Stock Section ── */}
          <section className="rounded-xl border bg-[rgb(var(--card))] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Boxes className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <h2 className="text-base font-semibold">Opening Stock</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-qty">Quantity (base units) *</Label>
                  <Input
                    id="fp-qty"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 48"
                    value={openingQuantity}
                    onChange={(e) => {
                      setOpeningQuantity(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fp-cost">Cost per base unit (Rs.) *</Label>
                  <Input
                    id="fp-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 80"
                    value={openingCost}
                    onChange={(e) => {
                      setOpeningCost(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-retail">Suggested Retail (Rs.)</Label>
                  <Input
                    id="fp-retail"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    value={retail}
                    onChange={(e) => setRetail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fp-wholesale">Suggested Wholesale (Rs.)</Label>
                  <Input
                    id="fp-wholesale"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    value={wholesale}
                    onChange={(e) => setWholesale(e.target.value)}
                  />
                </div>
              </div>

              {previewStock > 0 && (
                <div className="rounded-lg bg-[rgb(var(--muted))] px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted-fg))]">
                    Total opening stock value
                  </span>
                  <span className="font-semibold">
                    {formatMoney(previewStock)}
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

      {/* Inline: New Category */}
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

      {/* Inline: New Company */}
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

      {/* Inline: New Unit */}
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

  // Reset on open
  if (open && name === "" && secondField === "" && error === null) {
    // First render with open=true — fine
  }

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