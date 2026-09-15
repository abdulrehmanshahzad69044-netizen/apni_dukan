import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Wallet, ChevronRight, Calendar, User } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { usePayments } from "./hooks";
import { useCustomers } from "../customers/hooks";
import { formatMoney, formatDate } from "@/lib/format";

export function PaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<number | "">("");

  const { data: customers } = useCustomers();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      customerId: customerFilter === "" ? undefined : Number(customerFilter),
    }),
    [search, customerFilter]
  );
  const { data, loading } = usePayments(query);

  const grandTotal = data.reduce((s, p) => s + p.amount, 0);

  return (
    <Page
      title="Payments"
      description="Money received from customers."
      actions={
        <div className="flex items-center gap-2">
          <select
            value={customerFilter}
            onChange={(e) =>
              setCustomerFilter(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm max-w-[180px]"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <Input
              placeholder="Search customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      }
    >
      {!loading && data.length > 0 && (
        <div className="rounded-xl border bg-[rgb(var(--card))] p-4 mb-6">
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            {data.length} payment{data.length !== 1 ? "s" : ""} shown
          </p>
          <p className="text-2xl font-semibold mt-1">
            {formatMoney(grandTotal, { showDecimals: false })}
          </p>
        </div>
      )}

      {loading ? (
        <CenterSpinner />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-6 h-6" />}
          title={
            search || customerFilter !== ""
              ? "No payments match"
              : "No payments yet"
          }
          description={
            search || customerFilter !== ""
              ? "Try a different filter or search."
              : "Payments recorded from customers will appear here."
          }
        />
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/khaata/${p.customerId}`)}
              className="w-full text-left rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-medium truncate">
                    <User className="w-3.5 h-3.5" />
                    {p.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.paymentDate)}
                  </span>
                  {p.remarks && (
                    <span className="truncate">"{p.remarks}"</span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-semibold text-green-600 dark:text-green-400">
                  +{formatMoney(p.amount)}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-[rgb(var(--muted-fg))] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </Page>
  );
}