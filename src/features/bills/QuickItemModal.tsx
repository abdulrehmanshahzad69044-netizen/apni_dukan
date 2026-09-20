import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import { rupeesToPaisa, quantityToMilli } from "@/lib/format";
import type { CreateQuickItemInput } from "../../../electron/shared/types/variant";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-filled name from the search box */
  initialName: string;
  /** Called with the input after the user confirms; parent creates the variant */
  onConfirm: (input: CreateQuickItemInput) => Promise<void>;
};

export function QuickItemModal({
  open,
  onClose,
  initialName,
  onConfirm,
}: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPrice("");
      setCost("");
      setQuantity("1");
      setError(null);
    }
  }, [open, initialName]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Name is required");

    const priceN = Number(price);
    const costN = Number(cost);
    const qtyN = Number(quantity);

    if (!Number.isFinite(priceN) || priceN < 0) {
      return setError("Enter a valid selling price");
    }
    if (!Number.isFinite(costN) || costN < 0) {
      return setError("Enter a valid cost");
    }
    if (!Number.isFinite(qtyN) || qtyN <= 0) {
      return setError("Quantity must be positive");
    }

    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        name: trimmed,
        price: rupeesToPaisa(priceN),
        cost: rupeesToPaisa(costN),
        quantity: quantityToMilli(qtyN),
      });
      onClose();
    } catch (e) {
      const msg = (e as Error).message ?? "Failed to create";
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
      title="Add Quick Item"
      description="Create a one-off product and add it to the bill."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Zap className="w-4 h-4" />
            Add & Bill
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 flex gap-2">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            This will create a new product under the <strong>Quick Items</strong>{" "}
            category with its own stock. You can edit it later from the Products
            page.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qi-name">Item Name *</Label>
          <Input
            id="qi-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="qi-cost">Cost (Rs.) *</Label>
            <Input
              id="qi-cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={cost}
              onChange={(e) => {
                setCost(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qi-price">Price (Rs.) *</Label>
            <Input
              id="qi-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qi-qty">Stock Qty</Label>
            <Input
              id="qi-qty"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>
        </div>

        <p className="text-xs text-[rgb(var(--muted-fg))]">
          Stock quantity is how many units you have on hand right now. The
          system will track this going forward.
        </p>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}