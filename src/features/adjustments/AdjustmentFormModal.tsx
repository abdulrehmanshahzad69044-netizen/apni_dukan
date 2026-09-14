import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import { quantityToMilli } from "@/lib/format";
import { adjustmentApi } from "./api";
import { useVariants } from "../variants/hooks";
import type { AdjustmentType } from "../../../electron/shared/types/adjustment";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-select this variant (when opening from Stock page row action). */
  presetVariantId?: number;
};

type Sign = "positive" | "negative";

export function AdjustmentFormModal({
  open,
  onClose,
  onSaved,
  presetVariantId,
}: Props) {
  const [variantId, setVariantId] = useState<number | "">("");
  const [adjustmentType, setAdjustmentType] =
    useState<AdjustmentType>("damaged");
  const [sign, setSign] = useState<Sign>("negative");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: variants } = useVariants();

  useEffect(() => {
    if (open) {
      setVariantId(presetVariantId ?? "");
      setAdjustmentType("damaged");
      setSign("negative");
      setQuantity("");
      setReason("");
      setError(null);
    }
  }, [open, presetVariantId]);

  // Auto-set sign based on type
  useEffect(() => {
    if (adjustmentType === "damaged" || adjustmentType === "lost") {
      setSign("negative");
    } else if (adjustmentType === "return") {
      setSign("positive");
    }
  }, [adjustmentType]);

  const showSignToggle = adjustmentType === "correction";

  async function handleSave() {
    if (variantId === "") return setError("Select a variant");
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return setError("Quantity must be positive");
    }

    setSaving(true);
    setError(null);
    try {
      await adjustmentApi.create({
        variantId: Number(variantId),
        quantity: quantityToMilli(qty),
        adjustmentType,
        sign: showSignToggle ? sign : undefined,
        reason: reason.trim() || undefined,
      });
      toast.success("Adjustment recorded");
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
      title="Stock Adjustment"
      description="Write off damaged stock, log a loss, or correct inventory."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Adjustment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Variant */}
        <div className="space-y-1.5">
          <Label>Variant *</Label>
          <select
            value={variantId}
            onChange={(e) =>
              setVariantId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
          >
            <option value="">— Select variant —</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.productName} — {v.name} ({v.baseUnitShortName})
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <select
            value={adjustmentType}
            onChange={(e) =>
              setAdjustmentType(e.target.value as AdjustmentType)
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
          >
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
            <option value="correction">Correction (recount)</option>
            <option value="return">Return (customer returned)</option>
          </select>
        </div>

        {/* Sign toggle for correction */}
        {showSignToggle && (
          <div className="space-y-1.5">
            <Label>Direction *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSign("negative")}
                className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                  sign === "negative"
                    ? "bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400"
                    : "bg-[rgb(var(--bg))] hover:bg-[rgb(var(--muted))]"
                }`}
              >
                Missing (−)
              </button>
              <button
                type="button"
                onClick={() => setSign("positive")}
                className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                  sign === "positive"
                    ? "bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400"
                    : "bg-[rgb(var(--bg))] hover:bg-[rgb(var(--muted))]"
                }`}
              >
                Found (+)
              </button>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label htmlFor="adj-qty">Quantity *</Label>
          <Input
            id="adj-qty"
            autoFocus
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 2"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <Label htmlFor="adj-reason">Reason</Label>
          <Input
            id="adj-reason"
            placeholder="e.g. expired, broken bottle, miscounted"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}