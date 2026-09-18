import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import {
  rupeesToPaisa,
  toDateInputValue,
} from "@/lib/format";
import { udhaarApi } from "./api";
import { useCustomers } from "../customers/hooks";
import type { Customer } from "../../../electron/shared/types/customer";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Preset the customer (e.g. from Customer list row action) */
  presetCustomerId?: number;
  /** Preset the customer from a just-created customer */
  presetCustomer?: Customer;
};

export function RecordUdhaarModal({
  open,
  onClose,
  onSaved,
  presetCustomerId,
  presetCustomer,
}: Props) {
  const [customerId, setCustomerId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: customers } = useCustomers();

  useEffect(() => {
    if (open) {
      setCustomerId(
        presetCustomerId ?? presetCustomer?.id ?? ""
      );
      setAmount("");
      setDate(toDateInputValue(new Date()));
      setReason("");
      setError(null);
    }
  }, [open, presetCustomerId, presetCustomer]);

  async function handleSave() {
    if (customerId === "") return setError("Select a customer");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return setError("Amount must be a positive number");
    }

    setSaving(true);
    setError(null);
    try {
      await udhaarApi.create({
        customerId: Number(customerId),
        amount: rupeesToPaisa(amt),
        udhaarDate: new Date(date),
        reason: reason.trim() || undefined,
      });
      toast.success("Pending due recorded");
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
      title="Record Pending Due (Udhaar)"
      description="Add an existing customer debt that isn't tied to a bill."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Record Udhaar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Show preset customer as static, else dropdown */}
        {presetCustomer ? (
          <div className="rounded-lg bg-[rgb(var(--muted))] p-3">
            <p className="text-xs text-[rgb(var(--muted-fg))]">Customer</p>
            <p className="font-medium">{presetCustomer.name}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <select
              value={customerId}
              onChange={(e) =>
                setCustomerId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="">— Select customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ud-amount">Amount (Rs.) *</Label>
            <Input
              id="ud-amount"
              autoFocus
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ud-date">Date</Label>
            <Input
              id="ud-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ud-reason">Reason / Notes</Label>
          <Input
            id="ud-reason"
            placeholder="e.g. Old udhaar from before Apni Dukan"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}