import { Package, Pencil, Trash2, Ruler, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatQuantity } from "@/lib/format";
import type { Variant } from "../../../electron/shared/types/variant";

type Props = {
  variant: Variant;
  onEdit: () => void;
  onDelete: () => void;
};

export function VariantRow({ variant, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-[rgb(var(--muted))] flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-medium truncate">{variant.productName}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
            {variant.name}
          </span>
          {variant.lowStockThreshold !== null && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              Low at {formatQuantity(variant.lowStockThreshold)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
          <span className="flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            {variant.baseUnitName} ({variant.baseUnitShortName})
          </span>
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