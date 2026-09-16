import { useMemo, useState } from "react";
import {
  Search,
  TrendingDown,
  Plus,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { useExpenses } from "./hooks";
import { expenseApi } from "./api";
import { toast } from "@/lib/toast";
import { formatMoney, formatDate } from "@/lib/format";
import type { Expense } from "../../../electron/shared/types/expense";

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const query = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { data, loading, reload } = useExpenses(query);

  const total = data.reduce((s, e) => s + e.amount, 0);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await expenseApi.remove(deleting.id);
      toast.success("Expense deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title="Business Expenses"
        description="Rent, salary, utilities — costs that reduce net profit."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <Input
              placeholder="Search expenses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      >
        {!loading && data.length > 0 && (
          <div className="rounded-xl border bg-[rgb(var(--card))] p-4 mb-6">
            <p className="text-xs text-[rgb(var(--muted-fg))]">
              {data.length} expense{data.length !== 1 ? "s" : ""} shown
            </p>
            <p className="text-2xl font-semibold mt-1">
              {formatMoney(total, { showDecimals: false })}
            </p>
          </div>
        )}

        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<TrendingDown className="w-6 h-6" />}
            title={search ? "No expenses match" : "No expenses yet"}
            description={
              search
                ? "Try a different search."
                : "Track your operating costs to see true profit."
            }
            action={
              !search && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{e.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(e.date)}
                    </span>
                    {e.remarks && (
                      <span className="truncate italic">"{e.remarks}"</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    −{formatMoney(e.amount)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(e)}
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(e)}
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Expense" />

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete expense?"
        description={
          deleting
            ? `"${deleting.name}" will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}