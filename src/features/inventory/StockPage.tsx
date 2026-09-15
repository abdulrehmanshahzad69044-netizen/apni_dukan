import { useMemo, useState } from "react";
import { Search, Boxes } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { StockRow } from "./StockRow";
import { PriceHistoryModal } from "./PriceHistoryModal";
import { useStock, useInventoryTotals } from "./hooks";
import { formatMoney } from "@/lib/format";
import type { StockItem } from "../../../electron/shared/types/inventory";

type FilterOption = "all" | "in" | "low" | "out";
type SortOption =
  | "name"
  | "stock_asc"
  | "stock_desc"
  | "value_desc"
  | "value_asc";

export function StockPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("name");
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      filter,
      sort,
    }),
    [search, filter, sort]
  );

  const { data, loading } = useStock(query);
  const { data: totals } = useInventoryTotals();

  return (
    <>
      <Page
        title="Current Stock"
        description="What's in your shop right now."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="all">All</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
              <option value="low">Low stock</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="name">Name (A–Z)</option>
              <option value="stock_desc">Stock (high → low)</option>
              <option value="stock_asc">Stock (low → high)</option>
              <option value="value_desc">Value (high → low)</option>
              <option value="value_asc">Value (low → high)</option>
            </select>

            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <Input
                placeholder="Search product or variant…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        }
      >
        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                Variants in stock
              </p>
              <p className="text-2xl font-semibold mt-1">
                {totals.totalVariants}
              </p>
            </div>
            <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                Inventory value
              </p>
              <p className="text-2xl font-semibold mt-1">
                {formatMoney(totals.totalStockValue, { showDecimals: false })}
              </p>
            </div>
            <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                Low stock
              </p>
              <p className="text-2xl font-semibold mt-1 text-amber-600 dark:text-amber-400">
                {totals.lowStockCount}
              </p>
            </div>
            <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                Out of stock
              </p>
              <p className="text-2xl font-semibold mt-1 text-red-600 dark:text-red-400">
                {totals.outOfStockCount}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Boxes className="w-6 h-6" />}
            title={
              search || filter !== "all"
                ? "No items match"
                : "No stock yet"
            }
            description={
              search || filter !== "all"
                ? "Try a different filter or search."
                : "Record a purchase to add stock to your inventory."
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((item) => (
              <StockRow
                key={item.variantId}
                item={item}
                onShowPriceHistory={() => setHistoryItem(item)}
              />
            ))}
          </div>
        )}
      </Page>

      <PriceHistoryModal
        open={!!historyItem}
        onClose={() => setHistoryItem(null)}
        variantId={historyItem?.variantId ?? null}
        productName={historyItem?.productName ?? ""}
        variantName={historyItem?.variantName ?? ""}
        baseUnitShortName={historyItem?.baseUnitShortName ?? ""}
      />
    </>
  );
}