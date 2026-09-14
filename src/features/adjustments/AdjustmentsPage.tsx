import { useMemo, useState } from "react";
import { Search, ClipboardList, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { AdjustmentFormModal } from "./AdjustmentFormModal";
import { useAdjustments } from "./hooks";
import {
  formatQuantity,
  formatMoney,
  formatDate,
} from "@/lib/format";
import type { AdjustmentType } from "../../../electron/shared/types/adjustment";

const TYPE_LABELS: Record<AdjustmentType, string> = {
  damaged: "Damaged",
  lost: "Lost",
  correction: "Correction",
  return: "Return",
};

const TYPE_STYLES: Record<AdjustmentType, string> = {
  damaged:
    "bg-red-500/15 text-red-700 dark:text-red-400",
  lost: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  correction:
    "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  return:
    "bg-green-500/15 text-green-700 dark:text-green-400",
};

export function AdjustmentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AdjustmentType | "">("");
  const [formOpen, setFormOpen] = useState(false);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      adjustmentType: typeFilter === "" ? undefined : typeFilter,
    }),
    [search, typeFilter]
  );
  const { data, loading } = useAdjustments(query);

  return (
    <>
      <Page
        title="Stock Adjustments"
        description="Damaged, lost, corrected, and returned stock."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as AdjustmentType | "")
              }
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="">All types</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
              <option value="correction">Correction</option>
              <option value="return">Return</option>
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
        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-6 h-6" />}
            title={
              search || typeFilter !== ""
                ? "No adjustments match"
                : "No adjustments yet"
            }
            description={
              search || typeFilter !== ""
                ? "Try a different filter or search."
                : "Record your first stock adjustment."
            }
            action={
              !search &&
              typeFilter === "" && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Adjustment
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((a) => {
              const isNegative = a.quantity < 0;
              const totalValue = Math.round(
                (Math.abs(a.quantity) * a.unitCost) / 1000
              );
              return (
                <div
                  key={a.id}
                  className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-medium truncate">
                        {a.productName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                        {a.variantName}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          TYPE_STYLES[a.adjustmentType]
                        }`}
                      >
                        {TYPE_LABELS[a.adjustmentType]}
                      </span>
                    </div>
                    {a.reason && (
                      <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">
                        {a.reason}
                      </p>
                    )}
                    <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">
                      {formatDate(a.adjustmentDate)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-semibold text-lg ${
                        isNegative
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {isNegative ? "−" : "+"}
                      {formatQuantity(Math.abs(a.quantity))}
                      <span className="text-xs font-normal text-[rgb(var(--muted-fg))] ml-1">
                        {a.baseUnitShortName}
                      </span>
                    </p>
                    <p className="text-xs text-[rgb(var(--muted-fg))]">
                      Value {formatMoney(totalValue, { showDecimals: false })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Page>

      <Fab onClick={() => setFormOpen(true)} label="Adjustment" />

      <AdjustmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          // Reload page by re-mounting (simplest way to refresh)
          window.location.reload();
        }}
      />
    </>
  );
}