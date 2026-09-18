import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { variantApi } from "./api";
import { useProducts } from "../products/hooks";
import { useUnits } from "../units/hooks";
import { toast } from "@/lib/toast";
import { quantityToMilli, milliToQuantity } from "@/lib/format";
import type { Variant } from "../../../electron/shared/types/variant";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Variant | null;
  presetProductId?: number;
};

export function VariantFormModal({
  open,
  onClose,
  onSaved,
  initial,
  presetProductId,
}: Props) {
  const isEdit = !!initial;

  const [productId, setProductId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [baseUnitId, setBaseUnitId] = useState<number | "">("");
  const [purchaseUnitId, setPurchaseUnitId] = useState<number | "">("");
  const [purchaseUnitFactor, setPurchaseUnitFactor] = useState("");
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: products } = useProducts();
  const { data: units } = useUnits();

  // Live preview of the conversion
  const previewText = useMemo(() => {
    if (purchaseUnitId === "" || !purchaseUnitFactor) return null;
    const factor = Number(purchaseUnitFactor);
    if (!Number.isFinite(factor) || factor <= 0) return null;
    const fromUnit = units.find((u) => u.id === purchaseUnitId);
    const toUnit =
      baseUnitId !== "" ? units.find((u) => u.id === baseUnitId) : null;
    if (!fromUnit || !toUnit) return null;
    return `1 ${fromUnit.name} = ${factor} ${toUnit.name}${
      factor !== 1 ? "s" : ""
    }`;
  }, [purchaseUnitId, purchaseUnitFactor, baseUnitId, units]);

  useEffect(() => {
    if (open) {
      setProductId(initial?.productId ?? presetProductId ?? "");
      setName(initial?.name ?? "");
      setBaseUnitId(initial?.baseUnitId ?? "");
      setPurchaseUnitId(initial?.purchaseUnitId ?? "");
      setPurchaseUnitFactor(
        initial?.purchaseUnitFactor != null
          ? String(initial.purchaseUnitFactor)
          : ""
      );
      setThreshold(
        initial?.lowStockThreshold != null
          ? String(milliToQuantity(initial.lowStockThreshold))
          : ""
      );
      setError(null);
    }
  }, [open, initial, presetProductId]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!isEdit && productId === "") return setError("Select a product");
    if (!trimmed) return setError("Name is required");
    if (baseUnitId === "") return setError("Select a base unit");

    // Purchase unit validation
    const hasPurchaseUnit = purchaseUnitId !== "";
    const factorNum = purchaseUnitFactor.trim() === ""
      ? null
      : Number(purchaseUnitFactor);

    if (hasPurchaseUnit && (!factorNum || factorNum <= 0)) {
      return setError(
        "Conversion factor is required when a purchase unit is set"
      );
    }
    if (!hasPurchaseUnit && factorNum !== null && factorNum > 0) {
      return setError(
        "Select a purchase unit or clear the conversion factor"
      );
    }

    // Threshold
    let thresholdMilli: number | null = null;
    if (threshold.trim() !== "") {
      const t = Number(threshold);
      if (!Number.isFinite(t) || t < 0) {
        return setError("Threshold must be a non-negative number");
      }
      thresholdMilli = quantityToMilli(t);
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: trimmed,
        baseUnitId: Number(baseUnitId),
        purchaseUnitId: hasPurchaseUnit ? Number(purchaseUnitId) : null,
        purchaseUnitFactor:
          hasPurchaseUnit && factorNum ? Math.round(factorNum) : null,
        lowStockThreshold: thresholdMilli,
      };

      if (isEdit && initial) {
        await variantApi.update({ id: initial.id, ...payload });
        toast.success("Variant updated");
      } else {
        await variantApi.create({
          productId: Number(productId),
          ...payload,
        });
        toast.success("Variant added");
      }
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message ?? "Failed to save";
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Variant" : "New Variant"}
      description={
        isEdit
          ? "Update the variant details."
          : "Add a specific SKU like 250ml or 1L."
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? "Save Changes" : "Add Variant"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Product */}
        <div className="space-y-1.5">
          <Label>Product *</Label>
          <select
            disabled={isEdit}
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm disabled:opacity-60"
          >
            <option value="">— Select product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Variant name */}
        <div className="space-y-1.5">
          <Label htmlFor="variant-name">Variant Name *</Label>
          <Input
            id="variant-name"
            autoFocus
            placeholder="e.g. 250ml, 1L, Large"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        {/* Base unit */}
        <div className="space-y-1.5">
          <Label>Base Unit *</Label>
          <select
            value={baseUnitId}
            onChange={(e) =>
              setBaseUnitId(e.target.value === "" ? "" : Number(e.target.value))
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
            The unit your stock is tracked in. All quantities are stored in this
            unit.
          </p>
        </div>

        {/* Purchase unit (bulk) */}
        <div className="rounded-lg border bg-[rgb(var(--bg))] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-blue-500" />
            <p className="text-sm font-medium">
              Bulk Purchase Unit (optional)
            </p>
          </div>
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            If you buy/sell this variant in bulk (e.g. cartons), define the
            conversion here. Each variant can have its own conversion.
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
                <option value="">— None (sell only in base unit) —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pu-factor">
                Contents per Bulk Unit
              </Label>
              <Input
                id="pu-factor"
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
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                How many base units in one bulk unit
              </p>
            </div>
          </div>

          {previewText && (
            <div className="rounded-md bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-400 font-medium">
              {previewText}
            </div>
          )}
        </div>

        {/* Low stock threshold */}
        <div className="space-y-1.5">
          <Label htmlFor="variant-threshold">
            Low Stock Threshold{" "}
            <span className="text-[rgb(var(--muted-fg))] font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="variant-threshold"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 10"
            value={threshold}
            onChange={(e) => {
              setThreshold(e.target.value);
              if (error) setError(null);
            }}
          />
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            Alert when stock drops to or below this number (in base units).
            Leave empty for no alert.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}