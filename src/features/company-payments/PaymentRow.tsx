import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CenterSpinner } from "@/components/ui/Spinner";
import { companyPaymentApi, type CompanyPaymentAllocation } from "./api";
import { formatMoney, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CompanyPayment } from "../../../electron/shared/types/expense";

type Props = {
  payment: CompanyPayment;
};

export function PaymentRow({ payment }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [allocations, setAllocations] = useState<
    CompanyPaymentAllocation[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  async function toggleExpand() {
    if (!expanded && allocations === null) {
      setLoading(true);
      try {
        const rows = await companyPaymentApi.getAllocations(payment.id);
        setAllocations(rows);
      } catch (e) {
        toast.error((e as Error).message ?? "Failed to load allocations");
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  }

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-medium truncate">{payment.companyName}</h3>
            {payment.purchaseNumber ? (
              <button
                onClick={() =>
                  payment.purchaseId &&
                  navigate(`/purchases/${payment.purchaseId}`)
                }
                className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--border))]"
                title="Tied to a specific purchase"
              >
                <Link2 className="w-3 h-3" />
                {payment.purchaseNumber}
              </button>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                On account
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(payment.date)}
            </span>
            {payment.remarks && (
              <span className="truncate italic">"{payment.remarks}"</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-semibold text-blue-600 dark:text-blue-400">
            −{formatMoney(payment.amount)}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleExpand}
          aria-label="Toggle breakdown"
          title="Show how this payment was applied"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t bg-[rgb(var(--muted))]">
          {loading ? (
            <CenterSpinner />
          ) : !allocations || allocations.length === 0 ? (
            <p className="text-xs text-[rgb(var(--muted-fg))] py-3">
              No purchase allocations recorded for this payment.
            </p>
          ) : (
            <>
              <p className="text-xs text-[rgb(var(--muted-fg))] py-2">
                Applied to the following purchases (FIFO order):
              </p>
              <div className="rounded-lg border bg-[rgb(var(--bg))] overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="text-[rgb(var(--muted-fg))]">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">
                        Purchase #
                      </th>
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                      <th className="text-right px-3 py-2 font-medium">
                        Amount Applied
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((a) => (
                      <tr
                        key={a.id}
                        className="border-t cursor-pointer hover:bg-[rgb(var(--muted))]"
                        onClick={() =>
                          navigate(`/purchases/${a.purchaseId}`)
                        }
                      >
                        <td className="px-3 py-2 font-mono">
                          {a.purchaseNumber}
                        </td>
                        <td className="px-3 py-2 text-[rgb(var(--muted-fg))]">
                          {formatDate(a.purchaseDate)}
                        </td>
                        <td className="text-right px-3 py-2 font-medium">
                          {formatMoney(a.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}