import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/lib/toast";
import {
  rupeesToPaisa,
  toDateInputValue,
  formatMoney,
} from "@/lib/format";
import { companyPaymentApi } from "./api";
import { useCompanies } from "../companies/hooks";
import { usePurchases } from "../purchases/hooks";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  presetCompanyId?: number;
  presetPurchaseId?: number;
  presetAmountPaisa?: number;
};

export function CompanyPaymentFormModal({
  open,
  onClose,
  onSaved,
  presetCompanyId,
  presetPurchaseId,
  presetAmountPaisa,
}: Props) {
  const [companyId, setCompanyId] = useState<number | "">("");
  const [purchaseId, setPurchaseId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: companies } = useCompanies();

  // Fetch purchases for the selected company
  const purchaseQuery = useMemo(
    () => (companyId === "" ? {} : { companyId: Number(companyId), limit: 200 }),
    [companyId]
  );
  const { data: purchases } = usePurchases(purchaseQuery);

  // Unpaid purchases for FIFO preview (ordered oldest-first — matches backend)
  const unpaidPurchases = useMemo(() => {
    return purchases
      .filter((p) => p.paidAmount < p.totalAmount)
      .sort((a, b) => {
        if (a.purchaseDate !== b.purchaseDate)
          return a.purchaseDate - b.purchaseDate;
        return a.id - b.id;
      });
  }, [purchases]);

  const totalOutstanding = unpaidPurchases.reduce(
    (s, p) => s + (p.totalAmount - p.paidAmount),
    0
  );

  // FIFO allocation preview
  const preview = useMemo(() => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return [];
    const paying = rupeesToPaisa(amt);

    // If a specific purchase is chosen, only that one
    if (purchaseId !== "") {
      const pur = unpaidPurchases.find((p) => p.id === Number(purchaseId));
      if (!pur) return [];
      const outstanding = pur.totalAmount - pur.paidAmount;
      const allocate = Math.min(paying, outstanding);
      return [
        {
          purchaseId: pur.id,
          purchaseNumber: pur.purchaseNumber,
          purchaseDate: pur.purchaseDate,
          outstanding,
          allocate,
        },
      ];
    }

    // Else FIFO across all unpaid
    let remaining = paying;
    const rows: Array<{
      purchaseId: number;
      purchaseNumber: string;
      purchaseDate: number;
      outstanding: number;
      allocate: number;
    }> = [];

    for (const pur of unpaidPurchases) {
      if (remaining <= 0) break;
      const outstanding = pur.totalAmount - pur.paidAmount;
      const allocate = Math.min(remaining, outstanding);
      remaining -= allocate;
      if (allocate <= 0) continue;
      rows.push({
        purchaseId: pur.id,
        purchaseNumber: pur.purchaseNumber,
        purchaseDate: pur.purchaseDate,
        outstanding,
        allocate,
      });
    }

    return rows;
  }, [amount, purchaseId, unpaidPurchases]);

  const previewTotal = preview.reduce((s, r) => s + r.allocate, 0);
  const typedPaisa = Number(amount)
    ? rupeesToPaisa(Number(amount))
    : 0;
  const overpay = typedPaisa > 0 && previewTotal < typedPaisa;

  useEffect(() => {
    if (open) {
      setCompanyId(presetCompanyId ?? "");
      setPurchaseId(presetPurchaseId ?? "");
      setAmount(
        presetAmountPaisa !== undefined ? String(presetAmountPaisa / 100) : ""
      );
      setDate(toDateInputValue(new Date()));
      setRemarks("");
      setError(null);
    }
  }, [open, presetCompanyId, presetPurchaseId, presetAmountPaisa]);

  async function handleSave() {
    if (companyId === "") return setError("Select a company");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return setError("Amount must be a positive number");
    }
    if (overpay) {
      return setError(
        `Amount exceeds outstanding (${formatMoney(totalOutstanding)}). Reduce the amount.`
      );
    }

    setSaving(true);
    setError(null);
    try {
      await companyPaymentApi.create({
        companyId: Number(companyId),
        purchaseId: purchaseId === "" ? null : Number(purchaseId),
        amount: rupeesToPaisa(amt),
        date: new Date(date),
        remarks: remarks.trim() || "",
      });
      toast.success("Payment recorded");
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
      title="Record Company Payment"
      description="Money paid to a supplier."
      size="lg"
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
        {/* Company */}
        <div className="space-y-1.5">
          <Label>Company *</Label>
          <select
            value={companyId}
            onChange={(e) => {
              setCompanyId(
                e.target.value === "" ? "" : Number(e.target.value)
              );
              setPurchaseId("");
            }}
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
          >
            <option value="">— Select company —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase (optional) */}
        {companyId !== "" && (
          <div className="space-y-1.5">
            <Label>Against Purchase (optional)</Label>
            <select
              value={purchaseId}
              onChange={(e) =>
                setPurchaseId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="">— On account (FIFO across all) —</option>
              {unpaidPurchases.map((p) => {
                const outstanding = p.totalAmount - p.paidAmount;
                return (
                  <option key={p.id} value={p.id}>
                    {p.purchaseNumber} · Outstanding{" "}
                    {formatMoney(outstanding, { showDecimals: false })}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-[rgb(var(--muted-fg))]">
              Leave empty to FIFO-apply across all unpaid purchases, oldest
              first.
            </p>
          </div>
        )}

        {/* Amount + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-amount">Amount (Rs.) *</Label>
            <Input
              id="cp-amount"
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
            {companyId !== "" && (
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                Outstanding to this company:{" "}
                <span className="font-medium">
                  {formatMoney(totalOutstanding, { showDecimals: false })}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-date">Date</Label>
            <Input
              id="cp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-remarks">Remarks</Label>
          <Input
            id="cp-remarks"
            placeholder="Optional"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>

        {/* Allocation preview */}
        {preview.length > 0 && (
          <div
            className={`rounded-lg border p-3 ${
              overpay
                ? "border-red-500/40 bg-red-500/5"
                : "border-blue-500/30 bg-blue-500/5"
            }`}
          >
            <p className="text-xs font-medium text-[rgb(var(--muted-fg))] mb-2">
              {purchaseId === ""
                ? "Will be applied to these purchases (FIFO):"
                : "Will be applied to:"}
            </p>
            <div className="space-y-1">
              {preview.map((row) => (
                <div
                  key={row.purchaseId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono">{row.purchaseNumber}</span>
                  <span className="text-[rgb(var(--muted-fg))]">
                    {formatMoney(row.allocate)}
                    {row.allocate < row.outstanding && (
                      <span className="ml-1">
                        (of {formatMoney(row.outstanding, { showDecimals: false })})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {overpay && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                You typed {formatMoney(typedPaisa)} but only{" "}
                {formatMoney(previewTotal)} can be applied. Reduce the amount.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}