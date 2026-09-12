import { useMemo, useState } from "react";
import { Search, Users, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CustomerRow } from "./CustomerRow";
import { CustomerFormModal } from "./CustomerFormModal";
import { useCustomers } from "./hooks";
import { customerApi } from "./api";
import { toast } from "@/lib/toast";
import type { Customer } from "../../../electron/shared/types/customer";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const query = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { data, loading, reload } = useCustomers(query);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await customerApi.remove(deleting.id);
      toast.success("Customer deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title="Customers"
        description="Manage your customer list."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <Input
              placeholder="Search by name or phone…"
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
            icon={<Users className="w-6 h-6" />}
            title={search ? "No customers match" : "No customers yet"}
            description={
              search
                ? "Try a different search term."
                : "Add your first customer to start creating bills."
            }
            action={
              !search && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <CustomerRow
                key={c.id}
                customer={c}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Customer" />

      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete customer?"
        description={
          deleting
            ? `"${deleting.name}" will be hidden from lists. Financial records remain intact.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}