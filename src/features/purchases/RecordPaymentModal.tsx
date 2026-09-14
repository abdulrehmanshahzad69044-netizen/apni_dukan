import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import {
  formatMoney,
  rupeesToPaisa,
  paisaToRupees,
} from "@/lib/format";
import { purchaseApi } from "./api";
import type { Purchase } from "../../../electron/shared/types/purchase";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  purchase: Purchase;
};

export function RecordPaymentModal({ open, onClose, onSaved, purchase }: Props) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outstanding = purchase.totalAmount - purchase.paidAmount;

  useEffect(() => {
    if (open) {
      setAmount(String(paisaToRupees(outstanding)));
      setError(null);
    }
  }, [open, outstanding]);

  async function handleSave() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return setError("Enter a positive amount");
    }
    const paying = rupeesToPaisa(n);
    if (paying > outstanding) {
      return setError(
        `Amount exceeds outstanding (${formatMoney(outstanding)})`
      );
    }

    setSaving(true);
    setError(null);
    try {
      await purchaseApi.setPaidAmount(
        purchase.id,
        purchase.paidAmount + paying
      );
      toast.success("Payment recorded");
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message ?? "Failed to record payment";
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
      title="Record Payment"
      description={`${purchase.purchaseNumber} · ${purchase.companyName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Record Payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-[rgb(var(--muted))] p-3">
            <p className="text-xs text-[rgb(var(--muted-fg))] mb-0.5">Total</p>
            <p className="font-medium">{formatMoney(purchase.totalAmount)}</p>
          </div>
          <div className="rounded-lg bg-[rgb(var(--muted))] p-3">
            <p className="text-xs text-[rgb(var(--muted-fg))] mb-0.5">Paid</p>
            <p className="font-medium text-green-600 dark:text-green-400">
              {formatMoney(purchase.paidAmount)}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-0.5">
            Outstanding
          </p>
          <p className="font-semibold text-amber-700 dark:text-amber-400">
            {formatMoney(outstanding)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-amount">Amount Now (Rs.)</Label>
          <Input
            id="payment-amount"
            autoFocus
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            Pre-filled with the full outstanding. Edit to pay a partial amount.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}