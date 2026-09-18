import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Wallet,
  Receipt,
  StickyNote,
} from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { CenterSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecordPaymentModal } from "../payments/RecordPaymentModal";
import { useKhaataDetail } from "./hooks";
import { formatMoney, formatDate } from "@/lib/format";
import type { KhaataBill, KhaataUdhaar } from "../../../electron/shared/types/payment";

type MergedRow =
  | { kind: "bill"; when: number; bill: KhaataBill }
  | { kind: "udhaar"; when: number; udhaar: KhaataUdhaar };

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

  // Merge bills and udhaars by date
  const merged: MergedRow[] = [
    ...data.bills.map((b) => ({
      kind: "bill" as const,
      when: b.billDate,
      bill: b,
    })),
    ...data.udhaars.map((u) => ({
      kind: "udhaar" as const,
      when: u.udhaarDate,
      udhaar: u,
    })),
  ].sort((a, b) => a.when - b.when);

  return (
    <>
      <Page
        title={data.customerName}
        description="Outstanding bills & pending dues"
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
              All clear — no pending bills or udhaar.
            </p>
          </div>
        )}

        {merged.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="Nothing pending"
            description="This customer has paid everything."
          />
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">
              Pending items ({merged.length})
            </h2>
            <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">
                      Reference / Reason
                    </th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                    <th className="text-right px-4 py-2 font-medium">Paid</th>
                    <th className="text-right px-4 py-2 font-medium">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map((row, idx) => {
                    if (row.kind === "bill") {
                      const b = row.bill;
                      return (
                        <tr
                          key={`bill-${b.billId}-${idx}`}
                          className="border-t hover:bg-[rgb(var(--muted))] cursor-pointer"
                          onClick={() => navigate(`/billing/${b.billId}`)}
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400">
                              <Receipt className="w-3 h-3" />
                              Bill
                            </span>
                          </td>
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
                      );
                    }
                    const u = row.udhaar;
                    return (
                      <tr
                        key={`udhaar-${u.udhaarId}-${idx}`}
                        className="border-t"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-400">
                            <StickyNote className="w-3 h-3" />
                            Udhaar
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {u.reason ?? (
                            <span className="italic text-[rgb(var(--muted-fg))]">
                              Manual pending due
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[rgb(var(--muted-fg))]">
                          {formatDate(u.udhaarDate)}
                        </td>
                        <td className="text-right px-4 py-3">
                          {formatMoney(u.amount)}
                        </td>
                        <td className="text-right px-4 py-3 text-green-600 dark:text-green-400">
                          {formatMoney(u.paidAmount)}
                        </td>
                        <td className="text-right px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                          {formatMoney(u.remainingAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[rgb(var(--muted))]">
                  <tr>
                    <td
                      colSpan={5}
                      className="text-right px-4 py-3 font-medium"
                    >
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