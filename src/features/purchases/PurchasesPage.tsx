import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Truck, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { PurchaseRow } from "./PurchaseRow";
import { usePurchases } from "./hooks";
import { useCompanies } from "../companies/hooks";

export function PurchasesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<number | "">("");

  const { data: companies } = useCompanies();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      companyId: companyFilter === "" ? undefined : Number(companyFilter),
    }),
    [search, companyFilter]
  );
  const { data, loading } = usePurchases(query);

  return (
    <>
      <Page
        title="Purchases"
        description="Stock bought from companies."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={companyFilter}
              onChange={(e) =>
                setCompanyFilter(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
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
                placeholder="Search purchases…"
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
            icon={<Truck className="w-6 h-6" />}
            title={
              search || companyFilter !== ""
                ? "No purchases match"
                : "No purchases yet"
            }
            description={
              search || companyFilter !== ""
                ? "Try a different search or filter."
                : "Record your first purchase to add stock to your inventory."
            }
            action={
              !search &&
              companyFilter === "" && (
                <button
                  onClick={() => navigate("/purchases/new")}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Purchase
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((p) => (
              <PurchaseRow
                key={p.id}
                purchase={p}
                onClick={() => navigate(`/purchases/${p.id}`)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={() => navigate("/purchases/new")} label="New Purchase" />
    </>
  );
}