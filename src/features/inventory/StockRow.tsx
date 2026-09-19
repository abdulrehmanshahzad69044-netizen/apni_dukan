import { Package, AlertTriangle, TrendingUp, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatStockDisplay } from "@/lib/format";
import type { StockItem } from "../../../electron/shared/types/inventory";

type Props = {
  item: StockItem;
  onShowPriceHistory: () => void;
  onTogglePin: () => void;
};

export function StockRow({
  item,
  onShowPriceHistory,
  onTogglePin,
}: Props) {
  const hasStock = item.currentStock > 0;
  const isLow =
    item.lowStockThreshold !== null &&
    item.currentStock <= item.lowStockThreshold;

  const stockDisplay = formatStockDisplay(item.currentStock, {
    baseUnitShortName: item.baseUnitShortName,
    purchaseUnitShortName: item.purchaseUnitShortName,
    purchaseUnitFactor: item.purchaseUnitFactor,
  });

  return (
    <div
      className={`rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 ${
        item.pinned ? "border-amber-500/40" : ""
      }`}
    >
      {/* Pin toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePin}
        title={item.pinned ? "Unpin" : "Pin to top"}
        aria-label={item.pinned ? "Unpin" : "Pin"}
        className="shrink-0"
      >
        {item.pinned ? (
          <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
        ) : (
          <PinOff className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
        )}
      </Button>

      <div className="w-10 h-10 rounded-lg bg-[rgb(var(--muted))] flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-medium truncate">{item.productName}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
            {item.variantName}
          </span>
          {item.pinned && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              Pinned
            </span>
          )}
          {!hasStock && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400">
              Out of stock
            </span>
          )}
          {hasStock && isLow && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              Low
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
          <span>
            Avg cost: {formatMoney(item.avgCost, { showDecimals: false })}
          </span>
          {item.latestRetailPrice !== null && (
            <span>
              Retail:{" "}
              {formatMoney(item.latestRetailPrice, { showDecimals: false })}
            </span>
          )}
          <span>
            {item.activeBatchCount} batch
            {item.activeBatchCount !== 1 ? "es" : ""}
          </span>
          {item.lowStockThreshold !== null && (
            <span>
              Threshold:{" "}
              {formatStockDisplay(item.lowStockThreshold, {
                baseUnitShortName: item.baseUnitShortName,
                purchaseUnitShortName: item.purchaseUnitShortName,
                purchaseUnitFactor: item.purchaseUnitFactor,
              })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowPriceHistory}
          aria-label="Price history"
          title="Price history"
        >
          <TrendingUp className="w-4 h-4" />
        </Button>

        <div className="text-right">
          <p className="text-xs text-[rgb(var(--muted-fg))]">Stock</p>
          <p
            className={`font-semibold text-lg ${
              !hasStock
                ? "text-red-600 dark:text-red-400"
                : isLow
                ? "text-amber-600 dark:text-amber-400"
                : ""
            }`}
          >
            {stockDisplay}
          </p>
        </div>

        <div className="text-right min-w-[110px]">
          <p className="text-xs text-[rgb(var(--muted-fg))]">Value</p>
          <p className="font-medium">
            {formatMoney(item.stockValue, { showDecimals: false })}
          </p>
        </div>
      </div>
    </div>
  );
}