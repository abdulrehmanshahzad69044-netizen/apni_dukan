import { Truck, ChevronRight, Calendar } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";
import type { Purchase } from "../../../electron/shared/types/purchase";

type Props = {
  purchase: Purchase;
  onClick: () => void;
};

export function PurchaseRow({ purchase, onClick }: Props) {
  const outstanding = purchase.totalAmount - purchase.paidAmount;
  const isPaid = outstanding <= 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
    >
      <div className="w-10 h-10 rounded-lg bg-[rgb(var(--muted))] flex items-center justify-center shrink-0">
        <Truck className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
            {purchase.purchaseNumber}
          </span>
          <h3 className="font-medium truncate">{purchase.companyName}</h3>
          {!isPaid && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              Due {formatMoney(outstanding, { showDecimals: false })}
            </span>
          )}
          {isPaid && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
              Paid
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(purchase.purchaseDate)}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold">
          {formatMoney(purchase.totalAmount, { showDecimals: false })}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-[rgb(var(--muted-fg))] shrink-0" />
    </button>
  );
}