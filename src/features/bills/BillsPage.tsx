import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Receipt, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { BillRow } from "./BillRow";
import { useBills } from "./hooks";
import { useCustomers } from "../customers/hooks";
import type { BillListQuery } from "../../../electron/shared/types/bill";

type StatusFilter = "" | BillListQuery["status"];

export function BillsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const { data: customers } = useCustomers();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      customerId: customerFilter === "" ? undefined : Number(customerFilter),
      status: statusFilter === "" ? undefined : statusFilter,
    }),
    [search, customerFilter, statusFilter]
  );
  const { data, loading } = useBills(query);

  return (
    <>
      <Page
        title="Bills"
        description="All sales bills."
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="">All statuses</option>
              <option value="finalized">Finalized</option>
              <option value="draft">Draft</option>
              <option value="held">Held</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <Input
                placeholder="Search bill# or customer…"
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
            icon={<Receipt className="w-6 h-6" />}
            title={
              search || customerFilter !== "" || statusFilter !== ""
                ? "No bills match"
                : "No bills yet"
            }
            description={
              search || customerFilter !== "" || statusFilter !== ""
                ? "Try a different filter or search."
                : "Create your first bill to start selling."
            }
            action={
              !search &&
              customerFilter === "" &&
              statusFilter === "" && (
                <button
                  onClick={() => navigate("/billing/new")}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Bill
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((b) => (
              <BillRow
                key={b.id}
                bill={b}
                onClick={() => navigate(`/billing/${b.id}`)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={() => navigate("/billing/new")} label="New Bill" />
    </>
  );
}