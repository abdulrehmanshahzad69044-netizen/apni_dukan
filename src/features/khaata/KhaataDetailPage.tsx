import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Wallet, Receipt } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { CenterSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecordPaymentModal } from "../payments/RecordPaymentModal";
import { useKhaataDetail } from "./hooks";
import { formatMoney, formatDate } from "@/lib/format";

export function KhaataDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const id = customerId ? Number(customerId) : null;
  const { data, loading, reload } = useKhaataDetail(id);
  const [payOpen, setPayOpen] = useState(false);

  if (loading) {
    return (
      <Page title="Khaata">
        <CenterSpinner />
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Khaata">
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="Customer not found"
        />
      </Page>
    );
  }

  const hasOutstanding = data.totalOutstanding > 0;

  return (
    <>
      <Page
        title={data.customerName}
        description="Outstanding bills"
        actions={
          <div className="flex items-center gap-2">
            {hasOutstanding && (
              <Button onClick={() => setPayOpen(true)}>
                <Wallet className="w-4 h-4" />
                Record Payment
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/khaata")}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        }
      >
        {/* Contact info */}
        {(data.contactNumber || data.address) && (
          <div className="flex items-center gap-4 mb-6 text-sm text-[rgb(var(--muted-fg))]">
            {data.contactNumber && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {data.contactNumber}
              </span>
            )}
            {data.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {data.address}
              </span>
            )}
          </div>
        )}

        {/* Total outstanding */}
        {hasOutstanding ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
            <p className="text-xs text-[rgb(var(--muted-fg))] mb-0.5">
              Total outstanding
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatMoney(data.totalOutstanding)}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 mb-6">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              All clear — no pending bills.
            </p>
          </div>
        )}

        {data.bills.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="No unpaid bills"
            description="This customer has paid everything."
          />
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">
              Unpaid bills ({data.bills.length})
            </h2>
            <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Bill #</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                    <th className="text-right px-4 py-2 font-medium">Paid</th>
                    <th className="text-right px-4 py-2 font-medium">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.bills.map((b) => (
                    <tr
                      key={b.billId}
                      className="border-t hover:bg-[rgb(var(--muted))] cursor-pointer"
                      onClick={() => navigate(`/billing/${b.billId}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {b.billNumber}
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--muted-fg))]">
                        {formatDate(b.billDate)}
                      </td>
                      <td className="text-right px-4 py-3">
                        {formatMoney(b.totalAmount)}
                      </td>
                      <td className="text-right px-4 py-3 text-green-600 dark:text-green-400">
                        {formatMoney(b.paidAmount)}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                        {formatMoney(b.remainingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[rgb(var(--muted))]">
                  <tr>
                    <td colSpan={4} className="text-right px-4 py-3 font-medium">
                      Total
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                      {formatMoney(data.totalOutstanding)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </Page>

      <RecordPaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onSaved={reload}
        khaata={data}
      />
    </>
  );
}