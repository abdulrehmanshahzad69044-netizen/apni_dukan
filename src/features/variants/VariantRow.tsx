import {
  Package,
  Pencil,
  Trash2,
  Ruler,
  AlertTriangle,
  Boxes,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatQuantity } from "@/lib/format";
import type { Variant } from "../../../electron/shared/types/variant";

type Props = {
  variant: Variant;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVolatile: () => void;
};

export function VariantRow({
  variant,
  onEdit,
  onDelete,
  onToggleVolatile,
}: Props) {
  const hasBulk = variant.purchaseUnitId && variant.purchaseUnitFactor;

  return (
    <div
      className={`rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-[1px] hover:border-[rgb(var(--fg))]/15 ${
        variant.priceVolatile ? "border-amber-500/40" : ""
      }`}
    >
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
          {variant.priceVolatile && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400">
              <TrendingUp className="w-3 h-3" />
              Price Volatile
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))] flex-wrap">
          <span className="flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            Base: {variant.baseUnitName} ({variant.baseUnitShortName})
          </span>
          {hasBulk && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Boxes className="w-3 h-3" />
              1 {variant.purchaseUnitName} = {variant.purchaseUnitFactor}{" "}
              {variant.baseUnitName}
              {variant.purchaseUnitFactor !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant={variant.priceVolatile ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleVolatile}
          title={
            variant.priceVolatile
              ? "Remove from Update Prices"
              : "Add to Update Prices"
          }
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {variant.priceVolatile ? "Volatile" : "Mark Volatile"}
        </Button>
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