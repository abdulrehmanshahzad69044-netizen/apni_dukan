import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { variantApi } from "./api";
import { useProducts } from "../products/hooks";
import { useUnits } from "../units/hooks";
import { toast } from "@/lib/toast";
import type { Variant } from "../../../electron/shared/types/variant";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Variant | null;
  /** Pre-select this product when creating a new variant (used from Products flow). */
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: products } = useProducts();
  const { data: units } = useUnits();

  useEffect(() => {
    if (open) {
      setProductId(initial?.productId ?? presetProductId ?? "");
      setName(initial?.name ?? "");
      setBaseUnitId(initial?.baseUnitId ?? "");
      setError(null);
    }
  }, [open, initial, presetProductId]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!isEdit && productId === "") return setError("Select a product");
    if (!trimmed) return setError("Name is required");
    if (baseUnitId === "") return setError("Select a base unit");

    setSaving(true);
    setError(null);
    try {
      if (isEdit && initial) {
        await variantApi.update({
          id: initial.id,
          name: trimmed,
          baseUnitId: Number(baseUnitId),
        });
        toast.success("Variant updated");
      } else {
        await variantApi.create({
          productId: Number(productId),
          name: trimmed,
          baseUnitId: Number(baseUnitId),
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
      <div className="space-y-4">
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
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>

        {/* Base Unit */}
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
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}