import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import {
  rupeesToPaisa,
  paisaToRupees,
  toDateInputValue,
} from "@/lib/format";
import { expenseApi } from "./api";
import type { Expense } from "../../../electron/shared/types/expense";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Expense | null;
};

export function ExpenseFormModal({ open, onClose, onSaved, initial }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setAmount(
        initial ? String(paisaToRupees(initial.amount)) : ""
      );
      setDate(
        initial
          ? toDateInputValue(initial.date * 1000)
          : toDateInputValue(new Date())
      );
      setRemarks(initial?.remarks ?? "");
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Name is required");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return setError("Amount must be a positive number");
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: trimmed,
        amount: rupeesToPaisa(amt),
        date: new Date(date),
        remarks: remarks.trim() || "",
      };

      if (isEdit && initial) {
        await expenseApi.update({ id: initial.id, ...payload });
        toast.success("Expense updated");
      } else {
        await expenseApi.create(payload);
        toast.success("Expense added");
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
      title={isEdit ? "Edit Expense" : "New Expense"}
      description="Business expense (rent, salary, utilities, etc.)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? "Save Changes" : "Add Expense"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="exp-name">Name *</Label>
          <Input
            id="exp-name"
            autoFocus
            placeholder="e.g. Shop rent"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">Amount (Rs.) *</Label>
            <Input
              id="exp-amount"
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
            <Label htmlFor="exp-date">Date</Label>
            <Input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exp-remarks">Remarks</Label>
          <Input
            id="exp-remarks"
            placeholder="Optional"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
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