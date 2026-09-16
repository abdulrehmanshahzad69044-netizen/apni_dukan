import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { CenterSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useBill } from "./hooks";
import { billApi } from "./api";
import { toast } from "@/lib/toast";
import { formatMoney, formatDate, formatQuantity } from "@/lib/format";

export function BillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const billId = id ? Number(id) : null;
  const { data, loading, reload } = useBill(billId);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (loading) {
    return (
      <Page title="Bill">
        <CenterSpinner />
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Bill">
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="Bill not found"
        />
      </Page>
    );
  }

  const hasBalance = data.remainingAmount > 0;
  const isDraftish = data.status === "draft" || data.status === "held";
  const isFinalized = data.status === "finalized";

  async function handleFinalize() {
    if (!data) return;
    setFinalizing(true);
    try {
      await billApi.finalize(data.id);
      toast.success("Bill finalized");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  }

  async function handleDelete() {
    if (!data) return;
    try {
      await billApi.deleteDraft(data.id);
      toast.success("Draft deleted");
      navigate("/billing");
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title={data.billNumber}
        description={data.customerName ?? "Walk-in customer"}
        actions={
          <div className="flex items-center gap-2">
            {isDraftish && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={finalizing}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Delete
                </Button>
                <Button onClick={handleFinalize} loading={finalizing}>
                  <CheckCircle2 className="w-4 h-4" />
                  Finalize Bill
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => navigate("/billing")}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        }
      >
        {/* Status banner for drafts */}
        {isDraftish && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 mb-4 text-sm text-blue-700 dark:text-blue-400">
            This is a {data.status === "held" ? "held" : "draft"} bill. Stock
            hasn't been deducted yet. Click <strong>Finalize</strong> to complete
            the sale.
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
            <p className="text-xs text-[rgb(var(--muted-fg))]">Total</p>
            <p className="text-xl font-semibold mt-1">
              {formatMoney(data.totalAmount)}
            </p>
          </div>
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
            <p className="text-xs text-[rgb(var(--muted-fg))]">Paid</p>
            <p className="text-xl font-semibold mt-1 text-green-600 dark:text-green-400">
              {formatMoney(data.paidAmount)}
            </p>
          </div>
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
            <p className="text-xs text-[rgb(var(--muted-fg))]">Remaining</p>
            <p
              className={`text-xl font-semibold mt-1 ${
                hasBalance
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-[rgb(var(--fg))]"
              }`}
            >
              {formatMoney(data.remainingAmount)}
            </p>
          </div>
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
            <p className="text-xs text-[rgb(var(--muted-fg))]">Profit</p>
            <p
              className={`text-xl font-semibold mt-1 ${
                isFinalized
                  ? data.grossProfit >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                  : "text-[rgb(var(--muted-fg))]"
              }`}
            >
              {isFinalized ? formatMoney(data.grossProfit) : "—"}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-6 text-sm text-[rgb(var(--muted-fg))]">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(data.billDate)}
          </span>
          {data.customerName && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {data.customerName}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--muted))]">
            {data.status}
          </span>
        </div>

        {data.remarks && (
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4 mb-6">
            <p className="text-xs text-[rgb(var(--muted-fg))] mb-1">Remarks</p>
            <p className="text-sm">{data.remarks}</p>
          </div>
        )}

        {/* Items */}
        <h2 className="text-lg font-semibold mb-3">Items</h2>
        <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">
                  Product / Variant
                </th>
                <th className="text-right px-4 py-2 font-medium">Qty</th>
                <th className="text-right px-4 py-2 font-medium">Price</th>
                {isFinalized && (
                  <>
                    <th className="text-right px-4 py-2 font-medium">Cost</th>
                    <th className="text-right px-4 py-2 font-medium">Profit</th>
                  </>
                )}
                <th className="text-right px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const itemProfit = item.lineTotal - item.lineCogs;
                const fifoEntries = data.fifo[item.id] ?? [];
                const isExpanded = expandedItem === item.id;

                return (
                  <tbody key={item.id}>
                    <tr className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {fifoEntries.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedItem(isExpanded ? null : item.id)
                              }
                              className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
                              aria-label="Toggle batch details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <div>
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-xs text-[rgb(var(--muted-fg))]">
                              {item.variantName} · {item.baseUnitShortName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="text-right px-4 py-3">
                        {formatMoney(item.unitPrice)}
                      </td>
                      {isFinalized && (
                        <>
                          <td className="text-right px-4 py-3 text-[rgb(var(--muted-fg))]">
                            {formatMoney(item.lineCogs)}
                          </td>
                          <td
                            className={`text-right px-4 py-3 ${
                              itemProfit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatMoney(itemProfit)}
                          </td>
                        </>
                      )}
                      <td className="text-right px-4 py-3 font-medium">
                        {formatMoney(item.lineTotal)}
                      </td>
                    </tr>

                    {isExpanded && fifoEntries.length > 0 && (
                      <tr className="border-t bg-[rgb(var(--muted))]">
                        <td colSpan={isFinalized ? 6 : 4} className="px-4 py-3">
                          <p className="text-xs text-[rgb(var(--muted-fg))] mb-2">
                            Consumed from batches (FIFO)
                          </p>
                          <div className="space-y-1">
                            {fifoEntries.map((f) => (
                              <div
                                key={f.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span>
                                  Batch #{f.batchId} ·{" "}
                                  {formatDate(f.batchPurchaseDate)}
                                </span>
                                <span>
                                  {formatQuantity(f.quantityConsumed)} ×{" "}
                                  {formatMoney(f.unitCost)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </tbody>
            <tfoot className="bg-[rgb(var(--muted))]">
              <tr>
                <td
                  colSpan={isFinalized ? 4 : 2}
                  className="text-right px-4 py-3 font-medium"
                >
                  Total
                </td>
                {isFinalized && (
                  <td className="text-right px-4 py-3 font-medium text-green-600 dark:text-green-400">
                    {formatMoney(data.grossProfit)}
                  </td>
                )}
                <td className="text-right px-4 py-3 font-semibold">
                  {formatMoney(data.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Page>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete draft?"
        description="This will permanently remove this draft bill. No stock was deducted, so nothing needs to be restored."
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}