import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Truck, Calendar } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { CenterSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePurchase } from "./hooks";
import {
  formatMoney,
  formatDate,
  formatQuantity,
} from "@/lib/format";

export function PurchaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const purchaseId = id ? Number(id) : null;
  const { data, batches, loading } = usePurchase(purchaseId);

  if (loading) {
    return (
      <Page title="Purchase">
        <CenterSpinner />
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Purchase">
        <EmptyState
          icon={<Truck className="w-6 h-6" />}
          title="Purchase not found"
        />
      </Page>
    );
  }

  const outstanding = data.totalAmount - data.paidAmount;

  return (
    <Page
      title={data.purchaseNumber}
      description={data.companyName}
      actions={
        <Button
          variant="ghost"
          onClick={() => navigate("/purchases")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <p className="text-xs text-[rgb(var(--muted-fg))]">Outstanding</p>
          <p
            className={`text-xl font-semibold mt-1 ${
              outstanding > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-[rgb(var(--fg))]"
            }`}
          >
            {formatMoney(outstanding)}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-6 text-sm text-[rgb(var(--muted-fg))]">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {formatDate(data.purchaseDate)}
        </span>
      </div>

      {data.remarks && (
        <div className="rounded-xl border bg-[rgb(var(--card))] p-4 mb-6">
          <p className="text-xs text-[rgb(var(--muted-fg))] mb-1">Remarks</p>
          <p className="text-sm">{data.remarks}</p>
        </div>
      )}

      {/* Batches / Line items */}
      <h2 className="text-lg font-semibold mb-3">Items</h2>
      <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Product / Variant</th>
              <th className="text-right px-4 py-2 font-medium">Qty</th>
              <th className="text-right px-4 py-2 font-medium">Cost</th>
              <th className="text-right px-4 py-2 font-medium">Retail</th>
              <th className="text-right px-4 py-2 font-medium">Wholesale</th>
              <th className="text-right px-4 py-2 font-medium">Remaining</th>
              <th className="text-right px-4 py-2 font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{b.productName}</div>
                  <div className="text-xs text-[rgb(var(--muted-fg))]">
                    {b.variantName} · {b.baseUnitShortName}
                  </div>
                </td>
                <td className="text-right px-4 py-3">
                  {formatQuantity(b.quantityPurchased)}
                </td>
                <td className="text-right px-4 py-3">
                  {formatMoney(b.purchasePrice)}
                </td>
                <td className="text-right px-4 py-3">
                  {b.suggestedRetailPrice
                    ? formatMoney(b.suggestedRetailPrice)
                    : "—"}
                </td>
                <td className="text-right px-4 py-3">
                  {b.suggestedWholesalePrice
                    ? formatMoney(b.suggestedWholesalePrice)
                    : "—"}
                </td>
                <td className="text-right px-4 py-3">
                  <span
                    className={
                      b.remainingQuantity < b.quantityPurchased
                        ? "text-amber-600 dark:text-amber-400"
                        : ""
                    }
                  >
                    {formatQuantity(b.remainingQuantity)}
                  </span>
                </td>
                <td className="text-right px-4 py-3 font-medium">
                  {formatMoney(b.quantityPurchased * b.purchasePrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[rgb(var(--muted))]">
            <tr>
              <td colSpan={6} className="text-right px-4 py-3 font-medium">
                Total
              </td>
              <td className="text-right px-4 py-3 font-semibold">
                {formatMoney(data.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Page>
  );
}