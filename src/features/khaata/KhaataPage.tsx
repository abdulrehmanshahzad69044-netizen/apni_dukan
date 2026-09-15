import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Phone, ChevronRight, AlertCircle } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { useKhaataList } from "./hooks";
import { formatMoney, formatDate } from "@/lib/format";

export function KhaataPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { data, loading } = useKhaataList(query);

  const grandTotal = data.reduce((s, k) => s + k.totalOutstanding, 0);

  return (
    <Page
      title="Khaata"
      description="Customers who owe you money."
      actions={
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <Input
            placeholder="Search customer or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      }
    >
      {/* Grand total */}
      {!loading && data.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-xs text-[rgb(var(--muted-fg))]">
              Total outstanding across {data.length} customer
              {data.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xl font-semibold">
              {formatMoney(grandTotal)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <CenterSpinner />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title={search ? "No customers match" : "No pending khaata"}
          description={
            search
              ? "Try a different search."
              : "All customers are paid up. Nothing outstanding."
          }
        />
      ) : (
        <div className="space-y-2">
          {data.map((k) => (
            <button
              key={k.customerId}
              onClick={() => navigate(`/khaata/${k.customerId}`)}
              className="w-full text-left rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{k.customerName}</h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
                  {k.contactNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {k.contactNumber}
                    </span>
                  )}
                  <span>
                    {k.billCount} unpaid bill{k.billCount !== 1 ? "s" : ""}
                  </span>
                  {k.oldestBillDate && (
                    <span>Since {formatDate(k.oldestBillDate)}</span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  Outstanding
                </p>
                <p className="font-semibold text-lg text-amber-600 dark:text-amber-400">
                  {formatMoney(k.totalOutstanding, { showDecimals: false })}
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