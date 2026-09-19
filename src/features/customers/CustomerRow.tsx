import { Phone, MapPin, Pencil, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import type { Customer } from "../../../electron/shared/types/customer";

type Props = {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
};

export function CustomerRow({ customer, onEdit, onDelete }: Props) {
  const outstanding = customer.cachedOutstanding;
  const hasOutstanding = outstanding > 0;

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-[1px] hover:border-[rgb(var(--fg))]/15">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-medium truncate">{customer.name}</h3>
          {hasOutstanding && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Wallet className="w-3 h-3" />
              {formatMoney(outstanding, { showDecimals: false })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
          {customer.contactNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {customer.contactNumber}
            </span>
          )}
          {customer.address && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />
              {customer.address}
            </span>
          )}
          {!customer.contactNumber && !customer.address && (
            <span className="italic">No contact info</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}