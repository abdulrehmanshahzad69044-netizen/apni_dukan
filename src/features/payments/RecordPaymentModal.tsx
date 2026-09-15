import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import { formatMoney, rupeesToPaisa, paisaToRupees } from "@/lib/format";
import { paymentApi } from "./api";
import type { KhaataDetail } from "../../../electron/shared/types/payment";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  khaata: KhaataDetail;
};

export function RecordPaymentModal({ open, onClose, onSaved, khaata }: Props) {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Pre-fill with total outstanding
      setAmount(String(paisaToRupees(khaata.totalOutstanding)));
      setRemarks("");
      setError(null);
    }
  }, [open, khaata]);

  async function handleSave() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return setError("Enter a positive amount");
    }
    const paying = rupeesToPaisa(n);
    if (paying > khaata.totalOutstanding) {
      return setError(
        `Amount exceeds outstanding (${formatMoney(khaata.totalOutstanding)})`
      );
    }

    setSaving(true);
    setError(null);
    try {
      await paymentApi.create({
        customerId: khaata.customerId,
        amount: paying,
        remarks: remarks.trim() || undefined,
      });
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
      description={`${khaata.customerName} · ${khaata.bills.length} unpaid bill${
        khaata.bills.length !== 1 ? "s" : ""
      }`}
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
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-0.5">
            Total Outstanding
          </p>
          <p className="font-semibold text-amber-700 dark:text-amber-400 text-lg">
            {formatMoney(khaata.totalOutstanding)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pay-amount">Amount Received (Rs.)</Label>
          <Input
            id="pay-amount"
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
            Pre-filled with the full outstanding. Edit for a partial payment.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pay-remarks">Remarks</Label>
          <Input
            id="pay-remarks"
            placeholder="Optional"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}