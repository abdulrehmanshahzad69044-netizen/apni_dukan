import { useEffect, useMemo, useState } from "react";
import { Search, Building2, Plus, AlertCircle } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { CompanyPaymentFormModal } from "./CompanyPaymentFormModal";
import { PaymentRow } from "./PaymentRow";
import { useCompanyPayments } from "./hooks";
import { useCompanies } from "../companies/hooks";
import { companyPaymentApi } from "./api";
import { formatMoney } from "@/lib/format";

export function CompanyPaymentsPage() {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<number | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [totalOutstanding, setTotalOutstanding] = useState<number | null>(null);

  const { data: companies } = useCompanies();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      companyId: companyFilter === "" ? undefined : Number(companyFilter),
    }),
    [search, companyFilter]
  );
  const { data, loading, reload } = useCompanyPayments(query);

  // Load total outstanding across all companies
  useEffect(() => {
    let cancelled = false;
    companyPaymentApi
      .totalOutstanding()
      .then((v) => {
        if (!cancelled) setTotalOutstanding(v);
      })
      .catch(() => {
        if (!cancelled) setTotalOutstanding(0);
      });
    return () => {
      cancelled = true;
    };
  }, [data.length]);

  const grandTotal = data.reduce((s, p) => s + p.amount, 0);
  const hasOutstanding =
    totalOutstanding !== null && totalOutstanding > 0;

  return (
    <>
      <Page
        title="Company Payments"
        description="Money paid to suppliers."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={companyFilter}
              onChange={(e) =>
                setCompanyFilter(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm max-w-[180px]"
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <Input
                placeholder="Search company or purchase#…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        }
      >
        {/* Outstanding + total paid tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            className={`rounded-xl border p-4 ${
              hasOutstanding
                ? "border-amber-500/30 bg-amber-500/5"
                : "bg-[rgb(var(--card))]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {hasOutstanding && (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                Total outstanding to companies
              </p>
            </div>
            <p className="text-2xl font-semibold">
              {totalOutstanding === null
                ? "—"
                : formatMoney(totalOutstanding, { showDecimals: false })}
            </p>
          </div>

          {!loading && data.length > 0 && (
            <div className="rounded-xl border bg-[rgb(var(--card))] p-4">
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                {data.length} payment{data.length !== 1 ? "s" : ""} shown
              </p>
              <p className="text-2xl font-semibold mt-1">
                {formatMoney(grandTotal, { showDecimals: false })}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title={
              search || companyFilter !== ""
                ? "No payments match"
                : "No company payments yet"
            }
            description={
              search || companyFilter !== ""
                ? "Try a different filter or search."
                : "Record payments to your suppliers to track cash outflow."
            }
            action={
              !search &&
              companyFilter === "" && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Record Payment
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={() => setFormOpen(true)} label="Record Payment" />

      <CompanyPaymentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />
    </>
  );
}