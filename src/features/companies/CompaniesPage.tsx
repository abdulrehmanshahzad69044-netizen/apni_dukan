import { useMemo, useState } from "react";
import { Search, Building2, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CompanyRow } from "./CompanyRow";
import { CompanyFormModal } from "./CompanyFormModal";
import { useCompanies } from "./hooks";
import { companyApi } from "./api";
import { toast } from "@/lib/toast";
import type { Company } from "../../../electron/shared/types/company";

export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);

  const query = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { data, loading, reload } = useCompanies(query);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await companyApi.remove(deleting.id);
      toast.success("Company deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title="Companies"
        description="Suppliers and manufacturers."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <Input
              placeholder="Search companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      >
        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title={search ? "No companies match" : "No companies yet"}
            description={
              search
                ? "Try a different search term."
                : "Add a company to start recording purchases and stock."
            }
            action={
              !search && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Company
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <CompanyRow
                key={c.id}
                company={c}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Company" />

      <CompanyFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete company?"
        description={
          deleting
            ? `"${deleting.name}" will be hidden from lists. Linked records remain intact.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}