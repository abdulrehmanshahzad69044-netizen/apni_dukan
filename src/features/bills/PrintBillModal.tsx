import { useState } from "react";
import { Printer, FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { printBill, type PrintSize } from "@/lib/print";
import type { BillDetail } from "../../../electron/shared/types/bill";

type Props = {
  open: boolean;
  onClose: () => void;
  bill: BillDetail;
  /** Already on bill.previousDue, passed for convenience */
  previousOutstanding?: number;
};

const SIZE_OPTIONS: {
  value: PrintSize;
  label: string;
  desc: string;
}[] = [
  {
    value: "thermal_80",
    label: "Thermal 80mm",
    desc: "Standard receipt printer (most common)",
  },
  {
    value: "thermal_58",
    label: "Thermal 58mm",
    desc: "Small receipt printer",
  },
  {
    value: "a4",
    label: "A4 Invoice",
    desc: "Full-page invoice — best for PDF export",
  },
];

export function PrintBillModal({
  open,
  onClose,
  bill,
  previousOutstanding,
}: Props) {
  const [size, setSize] = useState<PrintSize>("thermal_80");
  const [printing, setPrinting] = useState(false);

  // Use the passed value or the bill's stored previousDue
  const prevDue = previousOutstanding ?? bill.previousDue ?? 0;

  async function handlePrint() {
    setPrinting(true);
    try {
      await printBill(bill, size, undefined, prevDue);
      toast.success(
        "Print dialog opened — pick a printer or 'Save as PDF'"
      );
      onClose();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to print");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Print Bill"
      description="Choose the paper size. In the next dialog, pick a printer or 'Save as PDF'."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={printing}>
            Cancel
          </Button>
          <Button onClick={handlePrint} loading={printing}>
            <Printer className="w-4 h-4" />
            Open Print Dialog
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSize(opt.value)}
            className={`w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors ${
              size === opt.value
                ? "border-[rgb(var(--fg))] bg-[rgb(var(--muted))]"
                : "hover:bg-[rgb(var(--muted))]"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                size === opt.value
                  ? "border-[rgb(var(--fg))]"
                  : "border-[rgb(var(--muted-fg))]"
              }`}
            >
              {size === opt.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--fg))]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">
                {opt.desc}
              </p>
            </div>
          </button>
        ))}

        {prevDue > 0 && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex gap-2">
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Previous due on print:</strong> The printed bill will
              show the previous outstanding and add it to the Grand Total.
            </p>
          </div>
        )}

        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 flex gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <strong>No printer?</strong> In the print dialog, choose{" "}
            <strong>"Save as PDF"</strong> (or "Microsoft Print to PDF" on
            Windows).
          </p>
        </div>
      </div>
    </Modal>
  );
}