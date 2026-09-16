import { Receipt, ChevronRight, Calendar, User, Pencil } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";
import type { Bill } from "../../../electron/shared/types/bill";

type Props = {
  bill: Bill;
  onClick: () => void;
};

const STATUS_STYLES: Record<Bill["status"], string> = {
  draft: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  held: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  finalized: "bg-green-500/15 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
  returned: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

const STATUS_LABELS: Record<Bill["status"], string> = {
  draft: "Draft",
  held: "Held",
  finalized: "Finalized",
  cancelled: "Cancelled",
  returned: "Returned",
};

export function BillRow({ bill, onClick }: Props) {
  const hasBalance = bill.remainingAmount > 0;
  const isDraft = bill.status === "draft";
  const isHeld = bill.status === "held";
  const isFinalized = bill.status === "finalized";
  const isDraftish = isDraft || isHeld;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${
        isHeld ? "border-blue-500/40" : isDraft ? "border-gray-500/40" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isHeld
            ? "bg-blue-500/15"
            : isDraft
            ? "bg-gray-500/15"
            : "bg-[rgb(var(--muted))]"
        }`}
      >
        {isDraftish ? (
          <Pencil
            className={`w-5 h-5 ${
              isHeld
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          />
        ) : (
          <Receipt className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
            {bill.billNumber}
          </span>
          {bill.customerName ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium">
              <User className="w-3 h-3" />
              {bill.customerName}
            </span>
          ) : (
            <span className="text-sm italic text-[rgb(var(--muted-fg))]">
              Walk-in
            </span>
          )}
          {!isFinalized && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                STATUS_STYLES[bill.status]
              }`}
            >
              {STATUS_LABELS[bill.status]}
            </span>
          )}
          {isFinalized && hasBalance && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              Due {formatMoney(bill.remainingAmount, { showDecimals: false })}
            </span>
          )}
          {isFinalized && !hasBalance && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
              Paid
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(bill.billDate)}
          </span>
          <span>
            {bill.itemCount} item{bill.itemCount !== 1 ? "s" : ""}
          </span>
          {isFinalized && (
            <span>
              Profit: {formatMoney(bill.grossProfit, { showDecimals: false })}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold">
          {formatMoney(bill.totalAmount, { showDecimals: false })}
        </p>
        {bill.paidAmount > 0 && bill.remainingAmount > 0 && (
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            Paid {formatMoney(bill.paidAmount, { showDecimals: false })}
          </p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-[rgb(var(--muted-fg))] shrink-0" />
    </button>
  );
}